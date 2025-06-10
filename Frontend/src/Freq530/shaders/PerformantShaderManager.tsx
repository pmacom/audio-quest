import { useEffect } from 'react';
import { useShaderCacheStore } from './store/useShaderCacheStore';
import { FastTrippyShader, BalancedTrippyShader, QualityTrippyShader } from './OptimizedCachedShader';
import { FREQ530_SHADER_EXAMPLES } from './examples/FREQ530_SHADER_EXAMPLES';

type PerformanceMode = 'fast' | 'balanced' | 'quality';

interface PerformantShaderManagerProps {
  mode?: PerformanceMode;
  enabledShaders?: string[]; // Only enable specific shaders
}

export const PerformantShaderManager = ({ 
  mode = 'balanced',
  enabledShaders = ['trip-video-material'] // Only enable the trippy material by default
}: PerformantShaderManagerProps) => {
  const shaders = useShaderCacheStore(s => s.shaders);
  const addShader = useShaderCacheStore(s => s.addShader);

  // Initialize with specified shaders only
  useEffect(() => {
    FREQ530_SHADER_EXAMPLES.forEach(shader => {
      if (enabledShaders.includes(shader.shaderId)) {
        console.log(`PerformantShaderManager: Adding optimized shader ${shader.shaderId}`);
        addShader({ ...shader, id: shader.shaderId });
      }
    });
  }, [addShader, enabledShaders]);

  // Choose shader component based on performance mode
  const ShaderComponent = {
    fast: FastTrippyShader,
    balanced: BalancedTrippyShader,
    quality: QualityTrippyShader,
  }[mode];

  return (
    <>
      {Object.values(shaders)
        .filter(shader => enabledShaders.includes(shader.shaderId))
        .map(shader => (
          <ShaderComponent
            key={shader.id}
            shaderSettings={shader}
          />
        ))
      }
    </>
  );
};

// Preset components for common use cases
export const FastTrippyMaterialsOnly = () => (
  <PerformantShaderManager 
    mode="fast" 
    enabledShaders={['trip-video-material']} 
  />
);

export const BalancedTrippyMaterialsOnly = () => (
  <PerformantShaderManager 
    mode="balanced" 
    enabledShaders={['trip-video-material']} 
  />
);

export const QualityTrippyMaterialsOnly = () => (
  <PerformantShaderManager 
    mode="quality" 
    enabledShaders={['trip-video-material']} 
  />
); 