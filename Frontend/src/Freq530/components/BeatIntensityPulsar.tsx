import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFreq530 } from '../audio/store/useFreq530';
import { Text } from '@react-three/drei';

export interface BeatIntensityPulsarProps {
  // Optional props for customization
  baseScale?: number;
  maxScaleMultiplier?: number;
  emissiveMultiplier?: number;
  decaySpeed?: number;
  color?: string;
  emissiveColor?: string;
  // Standard mesh props
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

export function BeatIntensityPulsar({
  baseScale = 1,
  maxScaleMultiplier = 1.5,
  emissiveMultiplier = 0.8,
  decaySpeed = 5,
  color = "red",
  emissiveColor = "red",
  ...props
}: BeatIntensityPulsarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Subscribe to relevant values from the Zustand store
  const beatIntensity = useFreq530(state => state.values.beatIntensity);
  const lastBeatTime = useFreq530(state => state.values.lastBeatTime);

  const [isPulsing, setIsPulsing] = useState(false);
  const [currentScale, setCurrentScale] = useState(baseScale);
  const [currentIntensity, setCurrentIntensity] = useState(0);
  const prevBeatTimeRef = useRef(lastBeatTime);

  // Detect new beats by change in last_beat_time
  useEffect(() => {
    if (lastBeatTime > 0 && lastBeatTime !== prevBeatTimeRef.current) {
      prevBeatTimeRef.current = lastBeatTime;
      setIsPulsing(true);
      // Use beat_intensity to determine peak of pulse
      setCurrentScale(baseScale + (beatIntensity || 0) * maxScaleMultiplier);
      setCurrentIntensity((beatIntensity || 0) * emissiveMultiplier);
    }
  }, [lastBeatTime, beatIntensity, baseScale, maxScaleMultiplier, emissiveMultiplier]);

  useFrame((state, delta) => {
    if (meshRef.current && meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      if (isPulsing) {
        // Apply decay
        const decayFactor = decaySpeed * delta;
        
        // Smooth scale interpolation back to base
        const targetScale = THREE.MathUtils.lerp(meshRef.current.scale.x, baseScale, decayFactor);
        meshRef.current.scale.set(targetScale, targetScale, targetScale);
        
        // Decay emissive intensity
        const newIntensity = Math.max(0, meshRef.current.material.emissiveIntensity - decayFactor * 2);
        meshRef.current.material.emissiveIntensity = newIntensity;

        // Check if pulse is complete
        if (Math.abs(meshRef.current.scale.x - baseScale) < 0.05 && newIntensity <= 0.01) {
          setIsPulsing(false);
          meshRef.current.scale.set(baseScale, baseScale, baseScale);
          meshRef.current.material.emissiveIntensity = 0;
        }
      } else {
        // Set initial scale when not pulsing
        if (isPulsing !== false) { // Only set on first render or reset
          meshRef.current.scale.set(currentScale, currentScale, currentScale);
          meshRef.current.material.emissiveIntensity = currentIntensity;
        }
      }
    }
  });

  return (
    <>
    <mesh ref={meshRef} {...props} castShadow receiveShadow scale={[baseScale, baseScale, baseScale]}>
      <sphereGeometry args={[0.7, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        emissive={emissiveColor} 
        emissiveIntensity={0} 
      />
    </mesh>
    <Text scale={0.4} position={[0, 0, 1]}>Beat Intensity</Text>
    </>
  );
} 