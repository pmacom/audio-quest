import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFBO } from '@react-three/drei';
import { useShaderVideoCacheStore } from './stores/useShaderVideoCacheStore';
import { CONSTANTS } from '../../constants';
import { VideoShaderSettings } from './types';
import { DefaultFragmentShader, DefaultVertexShader } from './defaultShader';

export const CachedVideoShader = ({
  id,
  shaderSettings,
}: {
  id?: string;
  shaderSettings?: VideoShaderSettings;
}) => {
  const { gl } = useThree();
  const { shaders, textures, setTexture } = useShaderVideoCacheStore();

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
      vertexShader: DefaultVertexShader,
      fragmentShader: DefaultFragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(CONSTANTS.DEFAULT_CACHE_SIZE, CONSTANTS.DEFAULT_CACHE_SIZE) },
        uAccumulatedTime: { value: 0 },
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
    console.log(`CachedVideoShader: Camera for ${shaderId}:`, camera ? 'created' : 'not created');
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

  // Always update shader and render to FBO every frame
  useFrame(({ clock }) => {
    if (!material) return;
//    material.uniforms.uAccumulatedTime.value = clock.getElapsedTime();
    gl.setRenderTarget(fbo);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    setTexture(shaderId, fbo.texture);
  }, -1);

  return null;
};