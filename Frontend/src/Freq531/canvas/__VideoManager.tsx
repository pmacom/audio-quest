import { useEffect } from 'react';
import { useVideoStore } from '../stores/useVideoStore';
import { DEBUG_VideoList, VideoSetting } from './VideoUpdater';

export const VideoManager = () => {
  const { loadVideo, removeVideo, videos } = useVideoStore();

  useEffect(() => {
    // Track current and desired video names
    const currentVideos = new Set(Object.keys(videos));
    const desiredVideos = new Set<string>();

    // Load videos from VideoList, handling duplicates
    DEBUG_VideoList.forEach((setting: VideoSetting) => {
      if (desiredVideos.has(setting.name)) {
        console.warn(`Duplicate video name "${setting.name}" in VideoList`);
        return;
      }
      desiredVideos.add(setting.name);
      if (!currentVideos.has(setting.name)) {
        loadVideo(setting);
      }
    });

    // Remove videos not in VideoList
    currentVideos.forEach((name) => {
      if (!desiredVideos.has(name)) {
        removeVideo(name);
      }
    });
  }, [loadVideo, removeVideo, videos]);

  return null;
};