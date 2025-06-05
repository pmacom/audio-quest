import { create } from 'zustand';
import * as THREE from 'three';

export interface VideoSetting {
  name: string;
  src: string;
  isMirror?: boolean;
  speedMultiplier?: number;
}

export interface VideoData {
  videoElement: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  // temporary canvas for reverse playback capture
  tempCanvas: HTMLCanvasElement;
  tempContext: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  frameBuffer: ImageData[];
  duration: number;
  aspectRatio: THREE.Vector2;
  settings: {
    isMirror: boolean;
    speedMultiplier: number;
    isReversed: boolean;
    currentTime: number;
    frameIndex: number;
  };
}

type VideoStore = {
  videos: Record<string, React.MutableRefObject<VideoData | null>>;
  videoRef: React.MutableRefObject<THREE.Texture | null>; // Faded texture for video
  alphaRef: React.MutableRefObject<THREE.Texture | null>; // Faded texture for alpha
  loadVideo: (setting: VideoSetting) => Promise<void>;
  removeVideo: (name: string) => void;
  updateVideos: (deltaTime: number) => void;
  toggleReverse: (name: string) => void;
  setFadedTexture: (type: 'video' | 'alpha', texture: THREE.Texture | null) => void;
};

export const useVideoStore = create<VideoStore>((set, get) => ({
  videos: {},
  videoRef: { current: null },
  alphaRef: { current: null },
  loadVideo: async (setting: VideoSetting) => {
    const { name, src, isMirror = false, speedMultiplier = 1 } = setting;
    if (get().videos[name]) return;

    const videoElement = document.createElement('video');
    videoElement.preload = 'auto';
    videoElement.crossOrigin = 'anonymous';
    videoElement.src = src;
    videoElement.loop = false;
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.autoplay = false;
    videoElement.setAttribute('playsinline', '');
    videoElement.style.display = 'none';
    document.body.appendChild(videoElement);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d', { willReadFrequently: true })!;
    const frameBuffer: ImageData[] = [];

    try {
      await new Promise<void>((resolve, reject) => {
        videoElement.addEventListener('loadeddata', () => resolve(), { once: true });
        videoElement.addEventListener('error', (e) => reject(new Error(`Video load error: ${e.message}`)), { once: true });
      });

      const maxDim = 640;
      const scale = Math.min(1, maxDim / Math.max(videoElement.videoWidth, videoElement.videoHeight));
      canvas.width = Math.round(videoElement.videoWidth * scale);
      canvas.height = Math.round(videoElement.videoHeight * scale);
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      texture.generateMipmaps = false;
      texture.colorSpace = THREE.SRGBColorSpace;

      const aspectRatio = new THREE.Vector2(
        canvas.width / canvas.height,
        1
      );

      const videoData: VideoData = {
        videoElement,
        canvas,
        context,
        tempCanvas,
        tempContext,
        texture,
        frameBuffer,
        duration: videoElement.duration,
        aspectRatio,
        settings: {
          isMirror,
          speedMultiplier,
          isReversed: false,
          currentTime: 0,
          frameIndex: 0,
        },
      };

      const videoRef = { current: videoData };
      set((state) => ({
        videos: { ...state.videos, [name]: videoRef },
      }));
    } catch (error) {
      console.error(`Failed to load video "${name}":`, error);
      videoElement.remove();
      canvas.remove();
    }
  },
  removeVideo: (name: string) => {
    const videoRef = get().videos[name];
    if (videoRef && videoRef.current) {
      const { videoElement, texture, canvas, tempCanvas } = videoRef.current;
      videoElement.pause();
      videoElement.remove();
      texture.dispose();
      canvas.remove();
      tempCanvas.remove();
      set((state) => {
        const { [name]: _, ...remainingVideos } = state.videos;
        return { videos: remainingVideos };
      });
    }
  },
  toggleReverse: (name: string) => {
    const videoRef = get().videos[name];
    if (videoRef && videoRef.current) {
      const { settings, frameBuffer, videoElement } = videoRef.current;
      settings.isReversed = !settings.isReversed;

      if (settings.isReversed && frameBuffer.length === 0) {
        const captureFrames = async () => {
          const frameRate = 10;
          const frameDuration = 1 / frameRate;
          const totalFrames = Math.floor(videoElement.duration * frameRate);
          let frameCount = 0;

          const { tempCanvas, tempContext } = videoRef.current!;
          const originalTime = videoElement.currentTime;

          while (frameCount < totalFrames) {
            videoElement.currentTime = frameCount * frameDuration;
            await new Promise<void>((resolve) => {
              videoElement.addEventListener('seeked', () => {
                tempContext.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
                frameBuffer.push(tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height));
                frameCount++;
                resolve();
              }, { once: true });
            });
            await new Promise((resolve) => setTimeout(resolve, 10));
          }

          videoElement.currentTime = originalTime;
        };

        captureFrames();
      }
    }
  },
  updateVideos: (deltaTime: number) => {
    const state = get();
    Object.values(state.videos).forEach((videoRef) => {
      if (videoRef.current) {
        const { videoElement, canvas, context, texture, frameBuffer, duration, settings } = videoRef.current;
        let { currentTime, frameIndex, isReversed } = settings;
        const { isMirror, speedMultiplier } = settings;

        const timeIncrement = deltaTime * speedMultiplier;

        if (isMirror && isReversed && frameBuffer.length > 0) {
          currentTime -= timeIncrement;
          frameIndex = Math.floor((currentTime / duration) * frameBuffer.length);

          if (currentTime <= 0) {
            currentTime = 0;
            frameIndex = 0;
            settings.isReversed = false;
          }

          if (frameIndex >= 0 && frameIndex < frameBuffer.length) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            const { tempCanvas, tempContext } = videoRef.current!;
            tempContext.putImageData(frameBuffer[frameIndex], 0, 0);
            context.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
            texture.needsUpdate = true;
          }
        } else {
          if (videoElement.paused) {
            videoElement.playbackRate = Math.abs(speedMultiplier);
            videoElement.play().catch((e) => console.error('Playback error:', e));
          }

          currentTime += timeIncrement;
          if (currentTime >= duration) {
            if (isMirror) {
              currentTime = duration - (currentTime - duration);
              settings.isReversed = true;
            } else {
              currentTime = currentTime % duration;
            }
          }

          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          texture.needsUpdate = true;
        }

        settings.currentTime = Math.max(0, Math.min(currentTime, duration));
        settings.frameIndex = frameIndex;
      }
    });
  },
  setFadedTexture: (type: 'video' | 'alpha', texture: THREE.Texture | null) => {
    set((state) => ({
      [type === 'video' ? 'videoRef' : 'alphaRef']: { current: texture },
    }));
  },
}));