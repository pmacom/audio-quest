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
      
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uAdjustedAccumulatedTime.value = ((audioState.adjustedTime - audioState.time) / 5) + clock.getElapsedTime() // You can update this if needed
      // materialRef.current.uniforms.TWEAK_3.value = (audioState.kick * 3) / 5
      // materialRef.current.uniforms.TWEAK_1.value = 1 + audioState.amplitudeDynamic
      // materialRef.current.uniforms.TWEAK_2.value = 1 +(audioState.cos / 10) + .5
      // materialRef.current.uniforms.TWEAK_2.value = (audioState.adjustedSinNormal / 10) / 100
      materialRef.current.uniforms.TWEAK_3.value = (audioState.kickDynamic / 2) * audioState.cosNormal
      materialRef.current.uniforms.TWEAK_4.value = ((audioState.kickDynamic / 2) * audioState.sinNormal) + 1
      // materialRef.current.uniforms.TWEAK_6.value = audioState.cos / 10000
      // materialRef.current.uniforms.TWEAK_7.value = audioState.kickDynamic + .5
      materialRef.current.uniforms.TWEAK_10.value = audioState.lowDynamic * 10
      materialRef.current.uniforms.TWEAK_2.value = audioState.cosNormal
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