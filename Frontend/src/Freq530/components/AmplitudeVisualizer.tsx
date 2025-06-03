import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFreq530 } from '../audio/store/useFreq530';
import { Text } from '@react-three/drei';

export interface AmplitudeVisualizerProps {
  // Optional props for customization
  baseScale?: number;
  scaleMultiplier?: number;
  lerpFactor?: number;
  color?: string;
  // Standard mesh props
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

export function AmplitudeVisualizer({
  baseScale = 0.2,
  scaleMultiplier = 1.8,
  lerpFactor = 0.1,
  color = "orange",
  ...props
}: AmplitudeVisualizerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Subscribe to the specific value from the Zustand store
  const amplitudeDynamic = useFreq530(state => state.values.amplitudeDynamic);

  useFrame(() => {
    if (meshRef.current) {
      const currentAmplitude = amplitudeDynamic || 0; // Default to 0 if undefined
      // Ensure a minimum size and scale up
      const targetScale = baseScale + currentAmplitude * scaleMultiplier;
      
      // Create target vector for smooth interpolation
      const targetVector = new THREE.Vector3(targetScale, targetScale, targetScale);
      
      // Smoothly interpolate to the target scale for softer visuals
      meshRef.current.scale.lerp(targetVector, lerpFactor);
    }
  });

  return (
    <>
    <mesh ref={meshRef} {...props} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <Text scale={0.4} position={[0, 0, 1]}>Amplitude</Text>
    </>
  );
} 