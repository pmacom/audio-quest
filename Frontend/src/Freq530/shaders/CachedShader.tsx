import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFBO } from '@react-three/drei';
import { useShaderCacheStore } from './store/useShaderCacheStore';
import { CONSTANTS } from '../constants';
import { Freq530InputRanges, ShaderSettings } from '../types';
import { useFreq530, Freq530FieldTypes } from '../audio/store/useFreq530';
import { Freq530FieldType } from '../types';

export const CachedShader = ({
  id,
  shaderSettings,
}: {
  id?: string;
  shaderSettings?: ShaderSettings;
}) => {
  const { gl } = useThree();
  const { shaders, textures, setTexture } = useShaderCacheStore();

  // Resolve ShaderSettings from id or prop
  const settings = useMemo(() => {
    if (shaderSettings) return shaderSettings;
    if (id && shaders[id]) return shaders[id];
    return null;
  }, [id, shaderSettings, shaders]);

  // Get shader ID
  const shaderId = settings?.shaderId || id;
  if (!shaderId || !settings) {
    console.warn(`CachedShader: No valid ShaderSettings for id ${id}`);
    return null;
  }

  // Check for existing texture
  const hasTexture = !!textures[shaderId];
  // console.log(`CachedShader: hasTexture for ${shaderId}:`, hasTexture);

  // Create FBO only if no texture exists
  const fbo = useFBO(CONSTANTS.DEFAULT_CACHE_SIZE, CONSTANTS.DEFAULT_CACHE_SIZE, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  });

  // Create scene and material with error handling
  const { scene, material } = useMemo(() => {
    // Always create scene/material for live updates
    const s = new THREE.Scene();
    const mat = new THREE.ShaderMaterial({
      vertexShader: settings.vertexShader,
      fragmentShader: settings.fragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(CONSTANTS.DEFAULT_CACHE_SIZE, CONSTANTS.DEFAULT_CACHE_SIZE) },
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
  }, [settings]);

  // Create orthographic camera
  const camera = useMemo(() => {
    const cam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    cam.position.set(0, 0, 1);
    cam.lookAt(0, 0, 0);
    return cam;
  }, []);

  // Log camera creation (only once)
  useEffect(() => {
    console.log(`CachedShader: Camera for ${shaderId}:`, camera ? 'created' : 'not created');
  }, [shaderId, camera]);

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

  // Always update shader and render to FBO every frame
  useFrame(({ clock }) => {
    if (!material) return;
    // Map Freq530 values to TWEAK uniforms
    if (shaderSettings && shaderSettings.ranges) {
      const values = useFreq530.getState().values;
      shaderSettings.ranges.forEach((tweak, i) => {
        const uniformName = `TWEAK_${i + 1}`;
        let mappedValue: number;
        if (!tweak.source) {
          // Use the default value from the range
          mappedValue = tweak.value;
        } else {
          const fieldType = Freq530FieldTypes[tweak.source as keyof typeof Freq530FieldTypes] as Freq530FieldType;
          const inputRange = Freq530InputRanges[fieldType] || { min: 0, max: 1 };
          const inputValue = values[tweak.source as keyof typeof values] as number;
          mappedValue = mapRange(
            inputValue,
            inputRange.min, inputRange.max,
            tweak.min, tweak.max
          );
        }
        if (material.uniforms[uniformName]) {
          // material.uniforms[uniformName].value = mappedValue;
        }
      });
    }
    material.uniforms.uAdjustedAccumulatedTime.value = clock.getElapsedTime();
    gl.setRenderTarget(fbo);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    setTexture(shaderId, fbo.texture);
  }, -1);

  return null;
};