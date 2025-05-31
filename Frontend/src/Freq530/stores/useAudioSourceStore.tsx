"use client"

import { create } from 'zustand'

// Singleton AudioContext manager
class AudioContextManager {
  private static instance: AudioContextManager;
  private audioContext: AudioContext | null = null;

  private constructor() {}

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  getContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  async closeContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}

interface AudioStreamState {
  deviceId: string;
  audioDevices: MediaDeviceInfo[];
  isAudioStreamSetup: boolean;
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  audioStream: MediaStream | null;
  isStreamActive: boolean;
  isAnalyserReady: boolean;
  audioSource: AudioBufferSourceNode | MediaStreamAudioSourceNode | null;
  selectedFile: string;
  isFilePlaying: boolean;
  availableFiles: string[];
  error: Error | null;
  lastActiveTimestamp: number;
}

interface AudioStreamActions {
  setupAudio: () => Promise<void>;
  stopAudioStream: () => void;
  toggleAudioStream: () => void;
  listAudioDevices: () => Promise<void>;
  playAudioFile: (filePath: string) => Promise<void>;
  stopAudioFile: () => void;
  setSelectedFile: (filePath: string) => void;
  cleanup: () => void;
  retrySetup: () => Promise<void>;
  clearError: () => void;
}

const RETRY_DELAY = 1000; // 1 second
const MAX_RETRIES = 3;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const cleanupAudioResources = async (state: AudioStreamState) => {
  // Stop and cleanup audio stream
  if (state.audioStream) {
    state.audioStream.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;
    });
  }

  // Stop and disconnect audio source
  if (state.audioSource) {
    if (state.audioSource instanceof AudioBufferSourceNode) {
      try {
        state.audioSource.stop();
      } catch (e) {
        console.warn('Error stopping AudioBufferSourceNode:', e);
      }
    }
    state.audioSource.disconnect();
  }

  // Disconnect analyser node
  if (state.analyserNode) {
    state.analyserNode.disconnect();
  }

  // Close audio context through singleton manager
  await AudioContextManager.getInstance().closeContext();
};

export const useAudioStreamStore = create<AudioStreamState & AudioStreamActions>()((set, get) => ({
  deviceId: '',
  audioDevices: [],
  isAudioStreamSetup: false,
  audioContext: null,
  audioStream: null,
  analyserNode: null,
  isStreamActive: false,
  isAnalyserReady: false,
  audioSource: null,
  selectedFile: '/music/Frequency_Maneuver.mp3',
  isFilePlaying: false,
  availableFiles: ['/music/Frequency_Maneuver.mp3'],
  error: null,
  lastActiveTimestamp: Date.now(),

  setupAudio: async () => {
    const state = get();
    let retryCount = 0;
    
    const attemptSetup = async (): Promise<void> => {
      try {
        // Clean up existing resources before setting up new ones
        await cleanupAudioResources(state);

        console.log('Requesting user media with deviceId:', state.deviceId);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: state.deviceId } },
        });

        const audioContext = AudioContextManager.getInstance().getContext();
        const analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 512;
        // Increase smoothing for more stable visualizations
        analyserNode.smoothingTimeConstant = 0.8;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyserNode);

        set({ 
          audioContext, 
          analyserNode, 
          isAudioStreamSetup: true, 
          audioStream: stream,
          isStreamActive: true,
          isAnalyserReady: true,
          audioSource: source,
          error: null,
          lastActiveTimestamp: Date.now()
        });
      } catch (error) {
        console.error('Error setting up audio:', error);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return attemptSetup();
        }
        set({ 
          isAudioStreamSetup: false,
          isStreamActive: false,
          isAnalyserReady: false,
          error: error instanceof Error ? error : new Error('Failed to setup audio')
        });
        throw error;
      }
    };

    return attemptSetup();
  },

  retrySetup: async () => {
    set({ error: null });
    return get().setupAudio();
  },

  clearError: () => {
    set({ error: null });
  },

  stopAudioStream: () => {
    const state = get();
    cleanupAudioResources(state);
    
    set({ 
      audioStream: null, 
      isStreamActive: false,
      isAudioStreamSetup: false,
      audioContext: null,
      analyserNode: null,
      isAnalyserReady: false,
      audioSource: null,
      isFilePlaying: false,
      error: null
    });
  },

  toggleAudioStream: () => {
    const { isStreamActive, audioStream } = get();
    if (audioStream) {
      audioStream.getTracks().forEach(track => {
        track.enabled = !isStreamActive;
      });
      set({ 
        isStreamActive: !isStreamActive,
        lastActiveTimestamp: Date.now()
      });
    }
  },

  listAudioDevices: async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(
        device => device.kind === 'audioinput' || device.kind === 'audiooutput'
      );
      set({ audioDevices, error: null });
    } catch (error: any) {
      console.error('Error fetching audio devices:', error);
      set({ 
        audioDevices: [],
        error: error instanceof Error ? error : new Error('Failed to list audio devices')
      });
      throw error;
    }
  },

  playAudioFile: async (filePath: string) => {
    const state = get();
    
    try {
      // Stop any existing playback or stream
      await cleanupAudioResources(state);

      const audioContext = AudioContextManager.getInstance().getContext();
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 512;
      analyserNode.smoothingTimeConstant = 0.8;

      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserNode);
      analyserNode.connect(audioContext.destination);

      source.start(0);

      set({
        audioContext,
        analyserNode,
        audioSource: source,
        isFilePlaying: true,
        isAudioStreamSetup: true,
        isAnalyserReady: true,
        selectedFile: filePath,
        error: null,
        lastActiveTimestamp: Date.now()
      });

      source.onended = () => {
        cleanupAudioResources(get());
        set({ 
          isFilePlaying: false,
          audioSource: null,
          isAudioStreamSetup: false,
          isAnalyserReady: false,
          audioContext: null,
          analyserNode: null
        });
      };

    } catch (error) {
      console.error('Error playing audio file:', error);
      cleanupAudioResources(state);
      set({
        isFilePlaying: false,
        audioSource: null,
        isAudioStreamSetup: false,
        isAnalyserReady: false,
        error: error instanceof Error ? error : new Error('Failed to play audio file')
      });
      throw error;
    }
  },

  stopAudioFile: () => {
    const state = get();
    cleanupAudioResources(state);
    set({
      isFilePlaying: false,
      audioSource: null,
      isAudioStreamSetup: false,
      isAnalyserReady: false,
      audioContext: null,
      analyserNode: null,
      error: null
    });
  },

  setSelectedFile: (filePath: string) => {
    set({ selectedFile: filePath });
  },

  cleanup: () => {
    const state = get();
    cleanupAudioResources(state);
    set({
      audioStream: null,
      isStreamActive: false,
      isAudioStreamSetup: false,
      audioContext: null,
      analyserNode: null,
      isAnalyserReady: false,
      audioSource: null,
      isFilePlaying: false,
      error: null
    });
  }
}));

// Set up automatic cleanup after inactivity
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useAudioStreamStore.getState();
    const now = Date.now();
    if (state.isAudioStreamSetup && 
        now - state.lastActiveTimestamp > INACTIVITY_TIMEOUT) {
      useAudioStreamStore.getState().cleanup();
    }
  }, 60000); // Check every minute
}
