import { create } from 'zustand';
import { VideoSetting } from './useVideoStore';

export const useVideoSequencer = create((set, get) => ({
  currentVideoIndex: 0,
  nextVideoIndex: 1,
  currentAlphaIndex: 0,
  nextAlphaIndex: 1,
  fade: 0,
  maskFade: 0,
  videoSettings: [],
  alphaSettings: [],
  transitionDuration: 2000, // 2s fade
  maxVideoDuration: 10000, // 10s before fade
  transitionStep: 'idle', // 'idle', 'fadeOut', 'swapBottom', 'fadeIn', 'swapTop'

  setVideoSettings: (settings: VideoSetting[]) => set({ videoSettings: settings }),
  setAlphaSettings: (settings: VideoSetting[]) => set({ alphaSettings: settings }),

  updateAnimation: (delta: number) => {

  },
}));