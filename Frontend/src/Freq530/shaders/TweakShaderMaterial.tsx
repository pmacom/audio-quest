import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from 'three';
import { ShaderSettings } from "../shaders/types";
import { useFreq530 } from "../stores/useFreq530";
import { getNormalizedTweakValue } from "../components/AudioStateView/utils";
import { UniformStateTypeSettings } from "../uniforms/types";

interface TweakShaderMaterialProps {
  shader: ShaderSettings
}

export const TweakShaderMaterial = ({ shader }: TweakShaderMaterialProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { ranges, fragmentShader, vertexShader } = shader
  const audioState = useFreq530();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uAdjustedAccumulatedTime.value = 0; // You can update this if needed
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        let uniformValue;
        let mappedRangeValue = undefined;
        if(range.source){
          const audioValue = audioState[range.source as keyof typeof audioState] as number;
          if(typeof audioValue !== 'number') return;
          const audioValueType = UniformStateTypeSettings[range.source as keyof typeof UniformStateTypeSettings];
          if(audioValueType){
            const inMin = audioValueType.min;
            const inMax = audioValueType.max;
            const outMin = range.min; 
            const outMax = range.max;
            mappedRangeValue = (audioValue - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
            materialRef.current.uniforms[`TWEAK_${i + 1}`].value = mappedRangeValue;
          }
        }else{
          uniformValue = range.value;
        }
      }
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