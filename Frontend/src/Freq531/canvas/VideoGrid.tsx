import { useEffect } from 'react';
import { useVideoStore } from '../stores/useVideoStore';
import { VideoSetting } from './VideoUpdater';

export const VideoGrid = ({ settings }: { settings: VideoSetting[] }) => {
  useEffect(() => {
    settings.forEach((setting) => {
      useVideoStore.getState().loadVideo(setting);
    });
    const currentNames = new Set(settings.map(s => s.name));
    Object.keys(useVideoStore.getState().videos).forEach((name) => {
      if (!currentNames.has(name)) {
        useVideoStore.getState().removeVideo(name);
      }
    });
  }, [settings]);

  const videosData = useVideoStore((state) => state.videos);

  return (
    <group>
      {settings.map((setting, index) => {
        const videoData = videosData[setting.name]?.current;
        if (!videoData) return null;

        const { texture, aspectRatio } = videoData;
        const height = 2;
        const width = height * aspectRatio.x;
        const x = (index - (settings.length - 1) / 2) * (width + 0.5);

        return (
          <mesh key={setting.name} position={[x, 0, 0]}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={texture} />
          </mesh>
        );
      })}
    </group>
  );
};