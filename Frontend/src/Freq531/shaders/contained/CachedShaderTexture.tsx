import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from 'three';
import { ShaderSettings } from "../../types";
import { useFreq530 } from "../../stores/useFreq530";
import { useCachedShader } from "./useFreq530Shaders";

interface CachedShaderTextureProps {
  shader: ShaderSettings
}

export const CachedShaderTexture = ({ shader }: CachedShaderTextureProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { fragmentShader, vertexShader } = shader
  const audioState = useFreq530(state => state.values);
  const setShaderTextureRef = useCachedShader(s => s.setShaderTextureRef)
  const shaderTextureRef = useCachedShader(s => s.getShaderTextureRef(shader.id))

  useEffect(() => {
    if (!shaderTextureRef || !materialRef.current) return
    // If you have a texture uniform, e.g. uTexture, use this:
    const texture = materialRef.current.uniforms.uTexture?.value;
    setShaderTextureRef(shader.id, texture);
    // Otherwise, do nothing here.
  }, [shaderTextureRef, materialRef, setShaderTextureRef])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      const t = clock.getElapsedTime()
      const period = 50;
      const min = -10;
      const max = 10;
      const amplitude = (max - min) / 2; // 50
      const mid = (max + min) / 4;       // 50
      materialRef.current.uniforms.uTime.value = t;
      materialRef.current.uniforms.TWEAK_2.value = (audioState.amplitudeDynamic / 30) + (audioState.sinNormal * 1)
      materialRef.current.uniforms.TWEAK_3.value = Math.cos((2 * Math.PI * t) / period) * amplitude + mid;
      materialRef.current.uniforms.TWEAK_6.value = ((audioState.adjustedTime - audioState.time) / 5) + clock.getElapsedTime()
      materialRef.current.uniforms.TWEAK_8.value = audioState.sinNormal + (2 * audioState.kickDynamic)
      materialRef.current.uniforms.TWEAK_9.value = audioState.amplitudeDynamic
    }
  });

  // Initialize uniforms with tweak values
  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uAdjustedAccumulatedTime: { value: 1.0 },
      TWEAK_1: { value: 1.0 },
      TWEAK_2: { value: 1.0 },
      TWEAK_3: { value: 1.0 },
      TWEAK_4: { value: 1.0 },
      TWEAK_5: { value: 1.0 },
      TWEAK_6: { value: 1.0 },
      TWEAK_7: { value: 1.0 },
      TWEAK_8: { value: 1.0 },
      TWEAK_9: { value: 1.0 },
      TWEAK_10: { value: 1.0 }
    };
  }, []);

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      side={THREE.DoubleSide}
      transparent={true}
    />
  );
};