import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFreq530 } from '../audio/store/useFreq530';

export interface DancingMountainsProps {
  // Optional props for customization
  mountainCount?: number;
  baseSize?: number;
  maxHeight?: number;
  spreadRadius?: number;
  animationIntensity?: number;
  lerpFactor?: number;
  useVertexColors?: boolean;
  wireframe?: boolean;
  // Standard mesh props
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

interface Mountain {
  id: number;
  position: [number, number, number];
  basePosition: [number, number, number];
  frequencyBand: 'low' | 'mid' | 'high' | 'kick' | 'snare' | 'hihat';
  baseScale: number;
  dancePhase: number; // Random phase offset for dancing motion
  colorHue: number; // Base color hue
}

export function DancingMountains({
  mountainCount = 12,
  baseSize = 1.0,
  maxHeight = 4.0,
  spreadRadius = 8,
  animationIntensity = 2.0,
  lerpFactor = 0.15,
  useVertexColors = false,
  wireframe = false,
  ...groupProps
}: DancingMountainsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mountainRefs = useRef<(THREE.Mesh | null)[]>([]);
  const previousScales = useRef<number[]>([]);
  const previousHeights = useRef<number[]>([]);
  const debugCounterRef = useRef(0);
  
  // Access store values
  const low = useFreq530(state => state.values.low);
  const mid = useFreq530(state => state.values.mid);
  const high = useFreq530(state => state.values.high);
  const kick = useFreq530(state => state.values.kick);
  const snare = useFreq530(state => state.values.snare);
  const hihat = useFreq530(state => state.values.hihat);
  const beatIntensity = useFreq530(state => state.values.beatIntensity);
  const amplitude = useFreq530(state => state.values.amplitude);

  // Generate mountain data
  const mountains = useMemo<Mountain[]>(() => {
    const mountainData: Mountain[] = [];
    const frequencyBands: Mountain['frequencyBand'][] = ['low', 'mid', 'high', 'kick', 'snare', 'hihat'];
    
    for (let i = 0; i < mountainCount; i++) {
      // Create organic positioning in a circle with some randomness
      const angle = (i / mountainCount) * Math.PI * 2;
      const distance = spreadRadius * (0.5 + Math.random() * 0.5); // Random distance from center
      const x = Math.cos(angle) * distance + (Math.random() - 0.5) * 2;
      const z = Math.sin(angle) * distance + (Math.random() - 0.5) * 2;
      const y = 0;
      
      mountainData.push({
        id: i,
        position: [x, y, z],
        basePosition: [x, y, z],
        frequencyBand: frequencyBands[i % frequencyBands.length],
        baseScale: 0.8 + Math.random() * 0.4, // Random base scale between 0.8 and 1.2
        dancePhase: Math.random() * Math.PI * 2, // Random phase for dancing
        colorHue: (i / mountainCount) * 360, // Spread hues across the spectrum
      });
    }
    
    return mountainData;
  }, [mountainCount, spreadRadius]);

  // Create mountain geometry (cone)
  const mountainGeometry = useMemo(() => {
    return new THREE.ConeGeometry(baseSize, maxHeight, 8, 3); // 8-sided cone with 3 height segments
  }, [baseSize, maxHeight]);

  // Initialize refs
  if (previousScales.current.length !== mountainCount) {
    previousScales.current = new Array(mountainCount).fill(1);
    previousHeights.current = new Array(mountainCount).fill(maxHeight);
  }

  // Helper function to get audio value for frequency band
  const getAudioValue = (band: Mountain['frequencyBand']): number => {
    switch (band) {
      case 'low': return low;
      case 'mid': return mid;
      case 'high': return high;
      case 'kick': return kick;
      case 'snare': return snare;
      case 'hihat': return hihat;
      default: return 0;
    }
  };

  useFrame((state) => {
    debugCounterRef.current++;
    const time = state.clock.elapsedTime;
    
    mountains.forEach((mountain, index) => {
      const meshRef = mountainRefs.current[index];
      if (!meshRef) return;

      // Get audio value for this mountain's frequency band
      const audioValue = getAudioValue(mountain.frequencyBand);
      const globalAmplitude = amplitude;
      const globalBeat = beatIntensity;

      // Calculate dancing motion
      const danceTime = time + mountain.dancePhase;
      const horizontalDance = Math.sin(danceTime * 2 + audioValue * 10) * animationIntensity * audioValue;
      const verticalBob = Math.sin(danceTime * 3 + audioValue * 8) * 0.5 * animationIntensity * audioValue;
      
      // Calculate target position (dancing around base position)
      const targetX = mountain.basePosition[0] + horizontalDance;
      const targetY = mountain.basePosition[1] + verticalBob;
      const targetZ = mountain.basePosition[2] + Math.cos(danceTime * 1.5 + audioValue * 6) * animationIntensity * audioValue;

      // Smooth position interpolation
      const currentPos = meshRef.position;
      currentPos.x += (targetX - currentPos.x) * lerpFactor;
      currentPos.y += (targetY - currentPos.y) * lerpFactor;
      currentPos.z += (targetZ - currentPos.z) * lerpFactor;

      // Calculate scale based on audio + base scale + global beat
      const audioScale = 1.0 + audioValue * 2.0 + globalBeat * 1.5;
      const targetScale = mountain.baseScale * audioScale;
      
      // Smooth scale interpolation
      const currentScale = previousScales.current[index];
      const newScale = currentScale + (targetScale - currentScale) * lerpFactor;
      previousScales.current[index] = newScale;
      
      meshRef.scale.setScalar(newScale);

      // Calculate height scaling (stretch the mountain vertically)
      const heightMultiplier = 1.0 + audioValue * 1.5 + globalAmplitude * 1.0;
      const targetHeight = heightMultiplier;
      
      // Smooth height interpolation
      const currentHeight = previousHeights.current[index];
      const newHeight = currentHeight + (targetHeight - currentHeight) * lerpFactor;
      previousHeights.current[index] = newHeight;
      
      meshRef.scale.y = newScale * newHeight;

      // Rotation based on audio
      meshRef.rotation.y = time * 0.5 + audioValue * 2 + mountain.dancePhase;
      meshRef.rotation.x = Math.sin(time + mountain.dancePhase) * 0.1 * audioValue;

      // Update material color if not using vertex colors
      if (!useVertexColors && meshRef.material instanceof THREE.MeshPhysicalMaterial) {
        const intensity = audioValue + globalAmplitude * 0.5;
        const hue = (mountain.colorHue + time * 30 + audioValue * 180) % 360;
        const saturation = 0.7 + intensity * 0.3;
        const lightness = 0.4 + intensity * 0.4;
        
        meshRef.material.color.setHSL(hue / 360, saturation, lightness);
        meshRef.material.emissive.setHSL(hue / 360, saturation * 0.5, intensity * 0.3);
      }
    });

    // Enhanced debug logging
    if (debugCounterRef.current % 60 === 0) {
      console.log('🏔️ DANCING MOUNTAINS:', {
        mountainCount,
        audioParams: {
          low: low.toFixed(3),
          mid: mid.toFixed(3),
          high: high.toFixed(3),
          kick: kick.toFixed(3),
          snare: snare.toFixed(3),
          hihat: hihat.toFixed(3),
          beatIntensity: beatIntensity.toFixed(3),
          amplitude: amplitude.toFixed(3)
        },
        animationIntensity,
        spreadRadius
      });
    }
  });

  return (
    <group ref={groupRef} {...groupProps}>
      {mountains.map((mountain, index) => (
        <mesh
          key={mountain.id}
          ref={(ref) => (mountainRefs.current[index] = ref)}
          geometry={mountainGeometry}
          position={mountain.position}
        >
          <meshPhysicalMaterial
            color={`hsl(${mountain.colorHue}, 70%, 50%)`}
            wireframe={wireframe}
            transparent={true}
            opacity={0.9}
            roughness={0.7}
            metalness={0.2}
            emissive={`hsl(${mountain.colorHue}, 50%, 10%)`}
          />
        </mesh>
      ))}
      
      {/* Optional ground plane */}
      <mesh position={[0, -maxHeight * 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[spreadRadius * 3, spreadRadius * 3]} />
        <meshPhysicalMaterial 
          color="#2a2a2a" 
          transparent={true} 
          opacity={0.3}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
} 