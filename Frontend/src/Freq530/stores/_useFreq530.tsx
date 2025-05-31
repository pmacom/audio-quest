import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AudioProcessor } from "../audio/AudioProcessor";

export enum Freq530StateKeys {
  time = 'time',
  adjustedTime = 'adjustedTime',
  sin = 'sin',
  cos = 'cos',
  sinNormal = 'sinNormal',
  cosNormal = 'cosNormal',
  adjustedSin = 'adjustedSin',
  adjustedCos = 'adjustedCos',
  adjustedSinNormal = 'adjustedSinNormal',
  adjustedCosNormal = 'adjustedCosNormal',
  low = 'low',
  mid = 'mid',
  high = 'high',
  kick = 'kick',
  snare = 'snare',
  hihat = 'hihat',
  vocalLikelihood = 'vocalLikelihood',
  amplitude = 'amplitude',
  rawAmplitude = 'rawAmplitude',
  beatIntensity = 'beatIntensity',
  bps = 'bps',
}

export interface PrimaryFreq530State {
  [Freq530StateKeys.time]: number;
  [Freq530StateKeys.adjustedTime]: number;
  [Freq530StateKeys.sin]: number;
  [Freq530StateKeys.cos]: number;
  [Freq530StateKeys.sinNormal]: number;
  [Freq530StateKeys.cosNormal]: number;
  [Freq530StateKeys.adjustedSin]: number;
  [Freq530StateKeys.adjustedCos]: number;
  [Freq530StateKeys.adjustedSinNormal]: number;
  [Freq530StateKeys.adjustedCosNormal]: number;
  [Freq530StateKeys.low]: number;
  [Freq530StateKeys.mid]: number;
  [Freq530StateKeys.high]: number;
  [Freq530StateKeys.kick]: number;
  [Freq530StateKeys.snare]: number;
  [Freq530StateKeys.hihat]: number;
  [Freq530StateKeys.vocalLikelihood]: number;
  [Freq530StateKeys.amplitude]: number;
  [Freq530StateKeys.rawAmplitude]: number;
  [Freq530StateKeys.beatIntensity]: number;
  [Freq530StateKeys.bps]: number;
}

export interface Freq530State extends PrimaryFreq530State {
  // Primary states that will be referenced from react components and used as uniforms in shaders
  isAudioActive: boolean;
  isInitialized: boolean;

  // Persisted states (gains and averages)
  kickGain: number;
  snareGain: number;
  hihatGain: number;
  vocalGain: number;
  amplitudeGain: number;
  rawAmplitudeGain: number;
  lowGain: number;
  midGain: number;
  highGain: number;
  kickAverage: number;

  // Essential enhanced features for visualization
  spectralCentroid: number;     // Brightness of sound
  chromaVector: Float32Array;   // Musical pitch content
  dominantNote: number;         // Current strongest musical note
  isOnset: boolean;            // Beat/note detection
  bpm: number;                 // Tempo
  tempoStability: number;      // How steady the tempo is
  beatPhase: number;          // Position within beat cycle

  // Method
  update: (deltaTime: number, frequencyData: Float32Array) => void;
}

export const useFreq530 = create<Freq530State>()(
  persist(
    (set, get) => ({
      // Initial PRIMARY states
      time: 0,
      adjustedTime: 0,
      sin: 0,
      cos: 1,
      sinNormal: 0.5,
      cosNormal: 1,
      adjustedSin: 0,
      adjustedCos: 1,
      adjustedSinNormal: 0.5,
      adjustedCosNormal: 1,
      low: 0,
      mid: 0,
      high: 0,
      kick: 0,
      snare: 0,
      hihat: 0,
      vocalLikelihood: 0,
      amplitude: 0,
      rawAmplitude: 0,
      beatIntensity: 0,
      bps: 0,
      isAudioActive: false,
      isInitialized: false,

      // Initial gain states
      kickGain: 1,
      snareGain: 1,
      hihatGain: 1,
      vocalGain: 1,
      amplitudeGain: 1,
      rawAmplitudeGain: 1,
      lowGain: 1,
      midGain: 1,
      highGain: 1,
      kickAverage: 0,

      // Initial essential enhanced features
      spectralCentroid: 0,
      chromaVector: new Float32Array(12),
      dominantNote: 0,
      isOnset: false,
      bpm: 120,
      tempoStability: 0.5,
      beatPhase: 0,

      update: (deltaTime: number, frequencyData: Float32Array) => {
        const state = get();
        const processor = AudioProcessor.getInstance();
        const newState = processor.update(deltaTime, frequencyData, state);
        set(newState);
      },
    }),
    {
      name: "audio-time-store",
      partialize: (state) => ({
        kickGain: state.kickGain,
        snareGain: state.snareGain,
        hihatGain: state.hihatGain,
        vocalGain: state.vocalGain,
        amplitudeGain: state.amplitudeGain,
        rawAmplitudeGain: state.rawAmplitudeGain,
        lowGain: state.lowGain,
        midGain: state.midGain,
        highGain: state.highGain,
        kickAverage: state.kickAverage,
      }),
    }
  )
);