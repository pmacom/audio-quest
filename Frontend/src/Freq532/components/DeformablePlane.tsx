import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFreq530 } from '../audio/store/useFreq530';

export interface DeformablePlaneProps {
  // Optional props for customization
  width?: number;
  height?: number;
  segmentsX?: number;
  segmentsY?: number;
  maxDisplacement?: number;
  lerpFactor?: number;
  color?: string;
  wireframe?: boolean;
  // Standard mesh props
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

export function DeformablePlane({
  width = 10,
  height = 10,
  segmentsX = 15,
  segmentsY = 15,
  maxDisplacement = 2,
  lerpFactor = 0.1,
  color = "deepskyblue",
  wireframe = false,
  ...props
}: DeformablePlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Subscribe to the frequency grid map from the store
  const frequencyGridMap = useFreq530(state => state.values.frequencyGridMap);

  // Memoize geometry to avoid re-creation on every render unless props change
  const geometry = useMemo(() => 
    new THREE.PlaneGeometry(width, height, segmentsX, segmentsY),
    [width, height, segmentsX, segmentsY]
  );

  // Store initial positions to ensure consistent mapping logic
  const initialPositions = useMemo(() => {
    if (geometry) {
      return Float32Array.from(geometry.attributes.position.array);
    }
    return null;
  }, [geometry]);

  // Store previous positions for smooth interpolation
  const previousPositions = useRef<Float32Array | null>(null);

  useFrame(() => {
    if (!meshRef.current || !initialPositions) {
      return;
    }

    const positions = meshRef.current.geometry.attributes.position;
    // console.log(positions);
    
    // Initialize previous positions if not set
    if (!previousPositions.current) {
      previousPositions.current = new Float32Array(positions.count * 3);
      // Copy initial flat positions
      console.log('POSITIONS COUNT', positions.count);
      for (let i = 0; i < positions.count; i++) {
        // console.log(i * 3 + 2)
        previousPositions.current[i * 3 + 2] = 0; // Z displacement starts at 0
        
      }
    }

    if (!frequencyGridMap || frequencyGridMap.length === 0) {
      // Set to a flat plane if no data, with smooth interpolation
      for (let i = 0; i < positions.count; i++) {
        const currentZ = positions.getZ(i);
        const targetZ = 0;
        const newZ = currentZ + (targetZ - currentZ) * lerpFactor;
        positions.setZ(i, newZ);
        previousPositions.current[i * 3 + 2] = newZ;
        //console.log(newZ);
      }
      positions.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
      return;
    }

    // Calculate grid resolution (assuming square grid)
    const gridResolution = Math.floor(Math.sqrt(frequencyGridMap.length));

    if (gridResolution * gridResolution !== frequencyGridMap.length && frequencyGridMap.length > 0) {
      console.warn(`frequency_grid_map length (${frequencyGridMap.length}) is not a perfect square. Using linear mapping.`);
    }

    for (let i = 0; i < positions.count; i++) {
      // Get original X, Y of the vertex (from when the plane was flat)
      const originalX = initialPositions[i * 3];
      const originalY = initialPositions[i * 3 + 1];

      // Normalize original vertex coordinates to 0-1 range
      // Assumes plane is centered at (0,0) before rotation
      const u = (originalX + width / 2) / width;
      const v = (originalY + height / 2) / height;

      let mapIndex: number;
      let displacementValue: number;

      if (gridResolution * gridResolution === frequencyGridMap.length) {
        // Perfect square grid mapping
        let gridX = Math.floor(u * gridResolution);
        let gridY = Math.floor(v * gridResolution);

        // Clamp indices to be within [0, gridResolution - 1]
        gridX = Math.min(Math.max(0, gridX), gridResolution - 1);
        gridY = Math.min(Math.max(0, gridY), gridResolution - 1);

        mapIndex = gridY * gridResolution + gridX;
      } else {
        // Linear mapping for non-square arrays
        const normalizedPosition = u * 0.5 + v * 0.5; // Combine u and v
        mapIndex = Math.floor(normalizedPosition * (frequencyGridMap.length - 1));
      }

      // Final clamp for the 1D array access
      mapIndex = Math.min(Math.max(0, mapIndex), frequencyGridMap.length - 1);

      displacementValue = frequencyGridMap[mapIndex] || 0;
      const targetDisplacement = displacementValue * maxDisplacement;

      // Smooth interpolation between current and target displacement
      const currentZ = previousPositions.current[i * 3 + 2];
      const newZ = currentZ + (targetDisplacement - currentZ) * lerpFactor;

      positions.setZ(i, newZ);
      previousPositions.current[i * 3 + 2] = newZ;
    }

    positions.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      castShadow 
      receiveShadow 
      rotation={[-Math.PI / 2, 0, 0]} // Rotate to make it horizontal if Y is up in world space
      {...props}
    >
      <meshStandardMaterial 
        color={color} 
        wireframe={wireframe} 
        side={THREE.DoubleSide}
        transparent={wireframe}
        opacity={wireframe ? 0.8 : 1.0}
      />
    </mesh>
  );
} 