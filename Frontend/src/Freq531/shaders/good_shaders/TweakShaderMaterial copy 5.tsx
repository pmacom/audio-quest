import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from 'three';
import { ShaderSettings } from "../types";
import { useFreq530, Freq530Field, Freq530FieldKeys, Freq530FieldTypes } from "../stores/useFreq530";
import { UniformStateTypeSettings } from "@/Freq530/uniforms/types";
// import { UniformStateTypeSettings } from "../uniforms/types";


interface TweakShaderMaterialProps {
  shader: ShaderSettings
}

export const TweakShaderMaterial = ({ shader }: TweakShaderMaterialProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { ranges, fragmentShader, vertexShader } = shader
  const audioState = useFreq530(state => state.values);

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
      materialRef.current.uniforms.TWEAK_8.value = audioState.sinNormal + (2 * audioState.kickDynamic) // (audioState.sinNormal /2 ) + .5
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
    />
  );
};