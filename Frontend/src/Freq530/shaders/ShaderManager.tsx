import { useEffect } from 'react';
import { useShaderCacheStore } from './store/useShaderCacheStore';
import { CachedShader } from './CachedShader';
import { FREQ530_SHADER_EXAMPLES } from './examples/FREQ530_SHADER_EXAMPLES';

export const ShaderManager = () => {
  const shaders = useShaderCacheStore(s => s.shaders);
  const addShader = useShaderCacheStore(s => s.addShader);

  // Initialize with default shaders
  useEffect(() => {
    FREQ530_SHADER_EXAMPLES.forEach(shader => {
      if (shader.isActive) {
        console.log(`530 - ShaderManager: Adding shader ${shader.shaderId}`);
        addShader({ ...shader, id: shader.shaderId });
      }
    });
  }, [addShader]);

  return (
    <>
      {Object.values(shaders).map(
        shader =>
          (shader.isActive || true) && (
            <CachedShader
              key={shader.id}
              shaderSettings={shader}
            />
          ),
      )}
    </>
  );
};