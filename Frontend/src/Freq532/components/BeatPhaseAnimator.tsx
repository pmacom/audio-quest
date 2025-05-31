import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFreq530 } from '../audio/store/useFreq530';
import { Text } from '@react-three/drei';

export interface BeatPhaseAnimatorProps {
  // Optional props for customization
  size?: number;
  oscillationAmplitude?: number;
  color?: string;
  // Standard mesh props
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

export function BeatPhaseAnimator({
  size = 0.5,
  oscillationAmplitude = 0.5,
  color = "lightgreen",
  ...props
}: BeatPhaseAnimatorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Since beat_phase is not available, we'll calculate our own phase using time and bps
  const time = useFreq530(state => state.values.time || 0);
  const bps = useFreq530(state => state.values.bps || 1);
  const lastBeatTime = useFreq530(state => state.values.lastBeatTime || 0);

  useFrame(() => {
    if (meshRef.current) {
      // Calculate beat phase manually
      const beatDuration = bps > 0 ? 1.0 / bps : 1.0;
      const timeSinceLastBeat = lastBeatTime > 0 ? time - lastBeatTime : 0;
      const beatPhase = timeSinceLastBeat > 0 ? (timeSinceLastBeat / beatDuration) % 1.0 : 0;
      
      const angle = beatPhase * Math.PI * 2;
      meshRef.current.rotation.z = angle;
      meshRef.current.position.y = Math.sin(angle) * oscillationAmplitude; // Example oscillation
      const phaseMin = Math.max(beatPhase * 10, 1)
      meshRef.current.scale.set(phaseMin, phaseMin, phaseMin);
    }
  });

  return (
    <>
    <mesh ref={meshRef} {...props} castShadow receiveShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <Text scale={0.4} position={[0, 0, 1]}>Beat Phase</Text>
    </>
  );
} 