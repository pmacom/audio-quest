import { useEffect } from 'react';
import { useShaderVideoCacheStore } from './stores/useShaderVideoCacheStore';
import { CachedVideoShader } from './CachedVideoShader';
import { VideoShaderDefault } from './constants';
import { VideoShaderSettings } from './types';

export const VideoShaderManager = () => {
  const shaders = useShaderVideoCacheStore(s => s.shaders);
  const addShader = useShaderVideoCacheStore(s => s.addShader);

  // Initialize with default shaders
  useEffect(() => {
    console.log(`530 - ShaderManager: Adding shader ${VideoShaderDefault.shaderId}`);
    addShader(VideoShaderDefault as VideoShaderSettings);
  }, [addShader]);

  return (
    <>
      {Object.values(shaders).map(
        shader =>
          (shader.isActive || true) && (
            <CachedVideoShader
              key={shader.id}
              shaderSettings={shader}
            />
          ),
      )}
    </>
  );
};