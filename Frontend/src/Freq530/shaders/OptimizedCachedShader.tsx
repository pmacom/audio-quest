import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFBO } from '@react-three/drei';
import { useShaderCacheStore } from './store/useShaderCacheStore';
import { CONSTANTS } from '../constants';
import { Freq530InputRanges, ShaderSettings } from '../types';
import { Freq530FieldType } from '../types';

interface OptimizedCachedShaderProps {
  id?: string;
  shaderSettings?: ShaderSettings;
  // Performance options
  updateFrequency?: number; // How often to update (1 = every frame, 2 = every other frame, etc.)
  maxFPS?: number; // Cap the shader FPS (e.g., 30fps even if main scene is 120fps)
  enableLOD?: boolean; // Lower quality when far from camera
}

export const OptimizedCachedShader = ({
  id,
  shaderSettings,
  updateFrequency = 2, // Default: update every other frame
  maxFPS = 60, // Default: cap at 60fps for shader rendering
  enableLOD = true,
}: OptimizedCachedShaderProps) => {
  const { gl } = useThree();
  const { shaders, textures, setTexture } = useShaderCacheStore();
  const frameCount = useRef(0);
  const lastUpdateTime = useRef(0);

  // Resolve ShaderSettings from id or prop
  const settings = useMemo(() => {
    if (shaderSettings) return shaderSettings;
    if (id && shaders[id]) return shaders[id];
    return null;
  }, [id, shaderSettings, shaders]);

  // Get shader ID
  const shaderId = settings?.shaderId || id;
  if (!shaderId || !settings) {
    console.warn(`OptimizedCachedShader: No valid ShaderSettings for id ${id}`);
    return null;
  }

  // Check for existing texture
  const hasTexture = !!textures[shaderId];

  // Create FBO with potentially lower resolution for performance
  const resolution = enableLOD ? CONSTANTS.DEFAULT_CACHE_SIZE / 2 : CONSTANTS.DEFAULT_CACHE_SIZE;
  const fbo = useFBO(resolution, resolution, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  });

  // Simplified fragment shader for better performance
  const optimizedFragmentShader = useMemo(() => {
    // Replace complex procedural functions with simpler versions
    return settings.fragmentShader.replace(
      /generateProceduralVideo\(([^)]+)\)/g,
      'generateSimpleVideo($1)'
    ).replace(
      /generateProceduralMask\(([^)]+)\)/g,
      'generateSimpleMask($1)'
    ).replace(
      // Add simplified functions before main()
      'varying vec2 vUv;',
      `varying vec2 vUv;

// Simplified video generation for better performance
vec3 generateSimpleVideo(vec2 uv, float time, float style) {
    vec2 p = uv * (1.0 + style);
    float wave = sin(p.x * 2.0 + time) * sin(p.y * 2.0 + time * 0.7);
    return vec3(0.5 + wave * 0.3, 0.3 + wave * 0.4, 0.7 + wave * 0.2) * style;
}

// Simplified mask generation for better performance
float generateSimpleMask(vec2 uv, float time, float style) {
    vec2 center = vec2(0.5);
    float dist = length(uv - center);
    return 0.5 + 0.5 * sin(dist * 4.0 - time + style);
}`
    );
  }, [settings.fragmentShader]);

  // Create scene and material with error handling
  const { scene, material } = useMemo(() => {
    const s = new THREE.Scene();
    const mat = new THREE.ShaderMaterial({
      vertexShader: settings.vertexShader,
      fragmentShader: optimizedFragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(resolution, resolution) },
        uAdjustedAccumulatedTime: { value: 0 },
        TWEAK_1: { value: 1 },
        TWEAK_2: { value: 1 },
        TWEAK_3: { value: 1 },
        TWEAK_4: { value: 1 },
        TWEAK_5: { value: 1 },
        TWEAK_6: { value: 1 },
        TWEAK_7: { value: 1 },
        TWEAK_8: { value: 1 },
        TWEAK_9: { value: 1 },
        TWEAK_10: { value: 1 },
      },
    });
    s.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat));
    return { scene: s, material: mat };
  }, [settings, optimizedFragmentShader, resolution]);

  // Create orthographic camera
  const camera = useMemo(() => {
    const cam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    cam.position.set(0, 0, 1);
    cam.lookAt(0, 0, 0);
    return cam;
  }, []);

  // Manage WebGL state and cleanup
  useEffect(() => {
    const prevAutoClear = gl.autoClear;
    gl.autoClear = false;
    return () => {
      gl.autoClear = prevAutoClear;
      if (material) material.dispose();
      fbo.dispose();
    };
  }, [gl, material, fbo]);

  function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    if (inMax === inMin) return outMin;
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  }

  // Optimized update with frame limiting
  useFrame(({ clock }) => {
    if (!material) return;

    frameCount.current++;
    const currentTime = clock.getElapsedTime();
    const targetFrameTime = 1 / maxFPS;

    // Skip frames based on updateFrequency
    if (frameCount.current % updateFrequency !== 0) return;

    // Skip frames to maintain maxFPS for shader rendering
    if (currentTime - lastUpdateTime.current < targetFrameTime) return;

    lastUpdateTime.current = currentTime;

    // Map Freq530 values to TWEAK uniforms (simplified)
    if (shaderSettings && shaderSettings.ranges) {
      shaderSettings.ranges.forEach((tweak, i) => {
        const uniformName = `TWEAK_${i + 1}`;
        let mappedValue: number;
        if (!tweak.source) {
          mappedValue = tweak.value;
        } else {
          // Use audio if available, otherwise use default
          try {
            const { useFreq530 } = require('../audio/store/useFreq530');
            const values = useFreq530.getState().values;
            const fieldType = require('../audio/store/useFreq530').Freq530FieldTypes[tweak.source] as Freq530FieldType;
            const inputRange = Freq530InputRanges[fieldType] || { min: 0, max: 1 };
            const inputValue = values[tweak.source as keyof typeof values] as number;
            mappedValue = mapRange(
              inputValue,
              inputRange.min, inputRange.max,
              tweak.min, tweak.max
            );
          } catch {
            mappedValue = tweak.value; // Fallback to default
          }
        }
        if (material.uniforms[uniformName]) {
          material.uniforms[uniformName].value = mappedValue;
        }
      });
    }

    material.uniforms.uAdjustedAccumulatedTime.value = currentTime;
    
    gl.setRenderTarget(fbo);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    setTexture(shaderId, fbo.texture);
  }, -1);

  return null;
};

// High-performance preset for basic usage
export const FastTrippyShader = (props: Omit<OptimizedCachedShaderProps, 'updateFrequency' | 'maxFPS'>) => (
  <OptimizedCachedShader 
    updateFrequency={4} // Update every 4th frame
    maxFPS={30}         // Cap at 30fps
    enableLOD={true}    // Use lower resolution
    {...props} 
  />
);

// Balanced preset for good quality/performance
export const BalancedTrippyShader = (props: Omit<OptimizedCachedShaderProps, 'updateFrequency' | 'maxFPS'>) => (
  <OptimizedCachedShader 
    updateFrequency={2} // Update every other frame
    maxFPS={60}         // Cap at 60fps
    enableLOD={false}   // Full resolution
    {...props} 
  />
);

// Quality preset for when performance isn't a concern
export const QualityTrippyShader = (props: Omit<OptimizedCachedShaderProps, 'updateFrequency' | 'maxFPS'>) => (
  <OptimizedCachedShader 
    updateFrequency={1} // Update every frame
    maxFPS={120}        // No FPS cap
    enableLOD={false}   // Full resolution
    {...props} 
  />
); 