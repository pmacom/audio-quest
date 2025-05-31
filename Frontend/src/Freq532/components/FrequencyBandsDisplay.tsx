import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFreq530 } from '../audio/store/useFreq530';
import { Text } from '@react-three/drei';

export interface FrequencyBandsDisplayProps {
  // Optional props for customization
  maxHeight?: number;
  spacing?: number;
  barWidth?: number;
  barDepth?: number;
  lerpFactor?: number;
  minHeight?: number;
  // Standard group props
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

interface BarProps {
  id: number;
  initialX: number;
  bandValue: number;
  maxHeight: number;
  color: THREE.Color;
  barWidth: number;
  barDepth: number;
  lerpFactor: number;
  minHeight: number;
}

const Bar = React.memo(({ 
  id, 
  initialX, 
  bandValue, 
  maxHeight, 
  color, 
  barWidth, 
  barDepth, 
  lerpFactor,
  minHeight 
}: BarProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const targetHeight = Math.max(minHeight, (bandValue / 255) * maxHeight);
    if (meshRef.current) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetHeight, lerpFactor);
      meshRef.current.position.y = meshRef.current.scale.y / 2;
    }
  });

  return (
    <>
    <mesh 
      ref={meshRef} 
      position={[initialX, minHeight / 2, 0]} 
      scale={[barWidth, minHeight, barDepth]} 
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <Text scale={0.4} position={[0, 0, 1]}>Frequency Bands</Text>
    </>
  );
});

export function FrequencyBandsDisplay({
  maxHeight = 5,
  spacing = 0.5,
  barWidth = 0.4,
  barDepth = 0.4,
  lerpFactor = 0.2,
  minHeight = 0.01,
  ...props
}: FrequencyBandsDisplayProps) {
  
  // Subscribe to quantized bands from the store
  const quantizedBands = useFreq530(state => state.values.quantizedBands);
  
  const numBands = quantizedBands?.length || 32; // Default to 32 if not provided early
  
  // Generate colors for each band
  const bandColors = useMemo(() => 
    Array(numBands).fill(null).map((_, index) => {
      const hue = index / numBands;
      return new THREE.Color().setHSL(hue, 0.7, 0.6);
    }), 
    [numBands]
  );

  return (
    <group {...props}>
      {(quantizedBands || Array(numBands).fill(0)).map((value, index) => {
        const initialX = (index - numBands / 2 + 0.5) * spacing;
        return (
          <Bar 
            key={index} 
            id={index} 
            initialX={initialX} 
            bandValue={value} 
            maxHeight={maxHeight} 
            color={bandColors[index]}
            barWidth={barWidth}
            barDepth={barDepth}
            lerpFactor={lerpFactor}
            minHeight={minHeight}
          />
        );
      })}
    </group>
  );
} 