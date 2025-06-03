import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFreq530 } from '../audio/store/useFreq530';

const debug = false;

export interface DeformablePlaneProps {
  // Optional props for customization
  width?: number;
  height?: number;
  segmentsX?: number;
  segmentsY?: number;
  maxDisplacement?: number;
  frequencyMultiplier?: number;
  lerpFactor?: number;
  color?: string;
  wireframe?: boolean;
  useVertexColors?: boolean;
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
  maxDisplacement = 4,
  frequencyMultiplier = 3.0,
  lerpFactor = 0.1,
  color = '#ffffff',
  wireframe = false,
  useVertexColors = true,
  ...meshProps
}: DeformablePlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const previousPositions = useRef<Float32Array | null>(null);
  const previousColors = useRef<Float32Array | null>(null);
  const debugCounterRef = useRef(0);
  
  // Access store values correctly
  const frequencyGridMap = useFreq530(state => state.values.frequencyGridMap);
  const low = useFreq530(state => state.values.low);
  const mid = useFreq530(state => state.values.mid);
  const high = useFreq530(state => state.values.high);
  const kick = useFreq530(state => state.values.kick);
  const beatIntensity = useFreq530(state => state.values.beatIntensity);
  const amplitude = useFreq530(state => state.values.amplitude);

  // Create geometry with vertex colors
  const { geometry, initialPositions } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    const positions = geo.attributes.position.array as Float32Array;
    const initialPos = new Float32Array(positions);
    
    // Add vertex colors attribute
    const colors = new Float32Array(positions.length);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Set dynamic draw usage for both position and color
    (geo.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (geo.attributes.color as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    
    return { geometry: geo, initialPositions: initialPos };
  }, [width, height, segmentsX, segmentsY]);

  // Create material with vertex colors support
  const material = useMemo(() => {
    if (useVertexColors) {
      return new THREE.MeshBasicMaterial({ 
        vertexColors: true,
        wireframe,
        transparent: true,
        opacity: 0.8
      });
    } else {
      return new THREE.MeshBasicMaterial({ 
        color,
        wireframe,
        transparent: true,
        opacity: 0.8
      });
    }
  }, [color, wireframe, useVertexColors]);

  useFrame(() => {
    debugCounterRef.current++;
    
    if (!meshRef.current || !initialPositions) {
      if (debug && debugCounterRef.current % 60 === 0) { // Log every 60 frames (~1 second)
        console.log('❌ NO MESH OR INITIAL POSITIONS'); // debug
      }
      return;
    }

    const mesh = meshRef.current;
    const geo = mesh.geometry;
    const positions = geo.attributes.position;
    const colors = geo.attributes.color;
    
    // Initialize previous positions and colors if not set
    if (!previousPositions.current) {
      previousPositions.current = new Float32Array(positions.count * 3);
      if (debug) console.log('🔧 INITIALIZED PREVIOUS POSITIONS:', positions.count, 'vertices'); // debug
    }
    
    if (!previousColors.current && useVertexColors) {
      previousColors.current = new Float32Array(colors.count * 3);
      if (debug) console.log('🎨 INITIALIZED VERTEX COLORS:', colors.count, 'vertices'); // debug
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
        
        // Fade colors to neutral when no data
        if (useVertexColors && previousColors.current) {
          const currentR = previousColors.current[i * 3];
          const currentG = previousColors.current[i * 3 + 1];
          const currentB = previousColors.current[i * 3 + 2];
          
          const newR = currentR + (0.3 - currentR) * lerpFactor;
          const newG = currentG + (0.3 - currentG) * lerpFactor;
          const newB = currentB + (0.5 - currentB) * lerpFactor;
          
          colors.setXYZ(i, newR, newG, newB);
          previousColors.current[i * 3] = newR;
          previousColors.current[i * 3 + 1] = newG;
          previousColors.current[i * 3 + 2] = newB;
        }
      }
      positions.needsUpdate = true;
      if (useVertexColors) colors.needsUpdate = true;
      geo.computeVertexNormals();
      
      // Debug log for no frequency data
      if (debug && debugCounterRef.current % 120 === 0) { // Log every 2 seconds
        console.log('🔇 NO FREQUENCY DATA: Plane returning to flat state'); // debug
      }
      return;
    }

    // Map 256 frequency grid values to vertex positions
    const gridSize = 16; // Assuming 16x16 = 256 grid
    let hasValidData = false;

    for (let i = 0; i < positions.count; i++) {
      // Map vertex index to grid coordinates
      const vertexX = i % (segmentsX + 1);
      const vertexY = Math.floor(i / (segmentsX + 1));
      
      // Map vertex coordinates to frequency grid coordinates
      const gridX = Math.floor((vertexX / segmentsX) * (gridSize - 1));
      const gridY = Math.floor((vertexY / segmentsY) * (gridSize - 1));
      const gridIndex = gridY * gridSize + gridX;
      
      // Get frequency data for this grid position
      const frequencyValue = frequencyGridMap[gridIndex] || 0;
      
      if (frequencyValue > 0) {
        hasValidData = true;
      }
      
      // Calculate target height based on frequency value
      const targetZ = frequencyValue * maxDisplacement * frequencyMultiplier;
      
      // Get current position and smoothly interpolate
      const currentZ = previousPositions.current[i * 3 + 2];
      const newZ = currentZ + (targetZ - currentZ) * lerpFactor;
      
      // Update position
      positions.setZ(i, newZ);
      previousPositions.current[i * 3 + 2] = newZ;
      
      // Calculate vertex colors based on audio parameters
      if (useVertexColors && previousColors.current) {
        // Map different audio parameters to RGB channels
        const redChannel = Math.min(1.0, kick * beatIntensity * 2.0); // Beat/kick energy → Red
        const greenChannel = Math.min(1.0, mid * amplitude * 1.5); // Mid frequencies → Green  
        const blueChannel = Math.min(1.0, high * 3.0); // High frequencies → Blue
        
        // Add some frequency-specific modulation
        const freqModulation = Math.min(1.0, frequencyValue * 2.0);
        const finalR = Math.min(1.0, redChannel + freqModulation * 0.3);
        const finalG = Math.min(1.0, greenChannel + freqModulation * 0.2);
        const finalB = Math.min(1.0, blueChannel + freqModulation * 0.4);
        
        // Smooth color interpolation
        const currentR = previousColors.current[i * 3];
        const currentG = previousColors.current[i * 3 + 1];
        const currentB = previousColors.current[i * 3 + 2];
        
        const newR = currentR + (finalR - currentR) * lerpFactor;
        const newG = currentG + (finalG - currentG) * lerpFactor;
        const newB = currentB + (finalB - currentB) * lerpFactor;
        
        colors.setXYZ(i, newR, newG, newB);
        previousColors.current[i * 3] = newR;
        previousColors.current[i * 3 + 1] = newG;
        previousColors.current[i * 3 + 2] = newB;
      }
    }

    // Update geometry
    positions.needsUpdate = true;
    if (useVertexColors) colors.needsUpdate = true;
    geo.computeVertexNormals();

    // Enhanced debug logging
    if (debugCounterRef.current % 60 === 0 && hasValidData) { // Log every 60 frames (~1 second)
      const sampleFreq = frequencyGridMap[0] || 0;
      const maxFreq = Math.max(...frequencyGridMap);
      const avgFreq = frequencyGridMap.reduce((a: number, b: number) => a + b, 0) / frequencyGridMap.length;
      
      if (debug) console.log('🎵 FREQUENCY DATA RECEIVED:', { // debug
        gridSize: `${gridSize}x${gridSize}`,
        sampleValue: sampleFreq.toFixed(4),
        maxValue: maxFreq.toFixed(4),
        avgValue: avgFreq.toFixed(4),
        maxDisplacement,
        frequencyMultiplier,
        effectiveMultiplier: (maxDisplacement * frequencyMultiplier).toFixed(2),
        audioParams: {
          kick: kick.toFixed(3),
          mid: mid.toFixed(3),
          high: high.toFixed(3),
          beatIntensity: beatIntensity.toFixed(3),
          amplitude: amplitude.toFixed(3)
        }
      });
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      material={material}
      {...meshProps}
    />
  );
} 