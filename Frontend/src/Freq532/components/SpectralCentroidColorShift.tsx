import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFreq530 } from '../audio/store/useFreq530';
import { Text } from '@react-three/drei';

export interface SpectralFluxColorShiftProps {
  // Optional props for customization
  radius?: number;
  segments?: number;
  rings?: number;
  lerpFactor?: number;
  saturation?: number;
  lightness?: number;
  minHue?: number;
  maxHue?: number;
  // Standard mesh props
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

export function SpectralFluxColorShift({
  radius = 0.7,
  segments = 32,
  rings = 32,
  lerpFactor = 0.1,
  saturation = 0.8,
  lightness = 0.5,
  minHue = 0.0,
  maxHue = 0.7,
  ...props
}: SpectralFluxColorShiftProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Subscribe to spectral flux from the store (using available field)
  const spectralFlux = useFreq530(state => state.values.spectralFlux || 0);
  
  const materialColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    // Map spectral_flux (0-1) to hue range
    const hue = THREE.MathUtils.lerp(minHue, maxHue, spectralFlux);
    materialColor.setHSL(hue, saturation, lightness);
    
    if (meshRef.current && meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      meshRef.current.material.color.lerp(materialColor, lerpFactor);
      meshRef.current.scale.set(spectralFlux, spectralFlux, spectralFlux);
    }
  });

  return (
    <>
    <mesh ref={meshRef} {...props} castShadow receiveShadow>
      <sphereGeometry args={[radius, segments, rings]} />
      <meshStandardMaterial color="white" /> {/* Initial color, will be updated */}
    </mesh>
    <Text scale={0.4} position={[0, 0, 1]}>Spectral Centroid</Text>
    </>
  );
} 