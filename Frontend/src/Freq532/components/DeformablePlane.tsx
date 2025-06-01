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
  const connectionState = useFreq530(state => state.connectionState);
  const connectWebSocket = useFreq530(state => state.connectWebSocket);
  
  // Debug counters
  const debugCounterRef = useRef(0);
  const lastDataLengthRef = useRef(0);
  
  // Debug: Connect WebSocket if not connected
  React.useEffect(() => {
    if (connectionState === 'idle') {
      console.log('🔌 DEFORMABLE PLANE: Connecting to WebSocket...');
      connectWebSocket();
    }
  }, [connectionState, connectWebSocket]);
  
  // Debug: Log connection state changes
  React.useEffect(() => {
    console.log(`🔗 DEFORMABLE PLANE: Connection state changed to: ${connectionState}`);
  }, [connectionState]);
  
  // Debug: Log frequency grid map changes with more detail
  React.useEffect(() => {
    const dataLength = frequencyGridMap?.length || 0;
    if (dataLength !== lastDataLengthRef.current) {
      console.log(`📊 DEFORMABLE PLANE: FrequencyGridMap updated:`, {
        length: dataLength,
        hasData: dataLength > 0,
        sampleValues: frequencyGridMap?.slice(0, 5),
        minValue: frequencyGridMap?.length ? Math.min(...frequencyGridMap) : 'N/A',
        maxValue: frequencyGridMap?.length ? Math.max(...frequencyGridMap) : 'N/A',
        avgValue: frequencyGridMap?.length ? (frequencyGridMap.reduce((a, b) => a + b, 0) / frequencyGridMap.length).toFixed(3) : 'N/A'
      });
      lastDataLengthRef.current = dataLength;
    }
  }, [frequencyGridMap]);

  // Create geometry with proper setup for dynamic updates
  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    // Ensure position attribute is set up for dynamic updates
    (geom.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    console.log(`🏗️ DEFORMABLE PLANE: Created geometry with ${(segmentsX + 1) * (segmentsY + 1)} vertices`);
    return geom;
  }, [width, height, segmentsX, segmentsY]);

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
    debugCounterRef.current++;
    
    if (!meshRef.current || !initialPositions) {
      if (debugCounterRef.current % 60 === 0) { // Log every 60 frames (~1 second)
        console.log('❌ NO MESH OR INITIAL POSITIONS');
      }
      return;
    }

    const mesh = meshRef.current;
    const geometry = mesh.geometry;
    const positions = geometry.attributes.position;
    
    // Initialize previous positions if not set
    if (!previousPositions.current) {
      previousPositions.current = new Float32Array(positions.count * 3);
      console.log(`🎯 INITIALIZING POSITIONS - VERTEX COUNT: ${positions.count}`);
      // Copy initial positions
      for (let i = 0; i < positions.count; i++) {
        previousPositions.current[i * 3] = positions.getX(i);
        previousPositions.current[i * 3 + 1] = positions.getY(i);
        previousPositions.current[i * 3 + 2] = positions.getZ(i);
      }
    }

    // Debug: Log frequency grid data occasionally
    if (debugCounterRef.current % 120 === 0) { // Log every 120 frames (~2 seconds)
      console.log(`🔄 FRAME ${debugCounterRef.current}: FrequencyGridMap length: ${frequencyGridMap?.length || 0}`);
      if (frequencyGridMap && frequencyGridMap.length > 0) {
        const sampleValues = frequencyGridMap.slice(0, 8);
        const nonZeroValues = frequencyGridMap.filter(v => Math.abs(v) > 0.001).length;
        console.log(`📈 Sample values: [${sampleValues.map(v => v.toFixed(3)).join(', ')}...]`);
        console.log(`⚡ Non-zero values: ${nonZeroValues}/${frequencyGridMap.length}`);
      }
    }

    if (!frequencyGridMap || frequencyGridMap.length === 0) {
      // When no frequency data is available, ensure plane remains static
      for (let i = 0; i < positions.count; i++) {
        const currentZ = previousPositions.current[i * 3 + 2];
        const targetZ = 0; // Target flat plane when no data
        
        // Smoothly return to flat state
        const newZ = currentZ + (targetZ - currentZ) * (lerpFactor * 2); // Faster return to flat
        
        // Update position array directly
        positions.setZ(i, newZ);
        previousPositions.current[i * 3 + 2] = newZ;
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      
      // Debug log for no data state
      if (debugCounterRef.current % 300 === 0) { // Log every 5 seconds
        console.log(`🔇 NO FREQUENCY DATA: Plane returning to flat state`);
      }
      
      return;
    }

    // Calculate grid resolution (assuming square grid)
    const gridResolution = Math.floor(Math.sqrt(frequencyGridMap.length));

    if (gridResolution * gridResolution !== frequencyGridMap.length && frequencyGridMap.length > 0) {
      if (debugCounterRef.current % 300 === 0) { // Log occasionally
        console.warn(`⚠️ frequency_grid_map length (${frequencyGridMap.length}) is not a perfect square. Using linear mapping.`);
      }
    }

    let updatedVertices = 0;
    let significantUpdates = 0;
    let maxDisplacementSeen = 0;

    // Get the position array for direct manipulation
    const positionArray = positions.array as Float32Array;

    for (let i = 0; i < positions.count; i++) {
      // Get original X, Y of the vertex (from initial positions)
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

      // Update position array directly (more efficient)
      const arrayIndex = i * 3 + 2; // Z component
      positionArray[arrayIndex] = newZ;
      previousPositions.current[i * 3 + 2] = newZ;
      
      if (Math.abs(newZ) > 0.01) updatedVertices++;
      if (Math.abs(targetDisplacement - currentZ) > 0.1) significantUpdates++;
      maxDisplacementSeen = Math.max(maxDisplacementSeen, Math.abs(newZ));
    }

    // Mark the position attribute as needing update
    positions.needsUpdate = true;
    
    // Recompute normals for proper lighting
    geometry.computeVertexNormals();

    // Debug: Log update info occasionally
    if (debugCounterRef.current % 120 === 0) {
      console.log(`🔺 VERTEX UPDATES: ${updatedVertices}/${positions.count} vertices displaced, ${significantUpdates} significant changes`);
      console.log(`📏 Max displacement seen: ${maxDisplacementSeen.toFixed(3)}, target max: ${maxDisplacement}`);
    }
  });

  // Debug: Log component props
  React.useEffect(() => {
    console.log(`🎨 DEFORMABLE PLANE PROPS:`, {
      width, height, 
      segments: `${segmentsX}x${segmentsY}`,
      maxDisplacement,
      wireframe,
      color,
      position: props.position
    });
  }, [width, height, segmentsX, segmentsY, maxDisplacement, wireframe, color, props.position]);

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