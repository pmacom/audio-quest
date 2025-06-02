import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFreq530 } from '../audio/store/useFreq530';

export interface DeformableDiskProps {
  // Optional props for customization
  radius?: number;
  segments?: number;
  maxDisplacement?: number;
  frequencyMultiplier?: number;
  lerpFactor?: number;
  color?: string;
  wireframe?: boolean;
  useVertexColors?: boolean;
  quadrantRotation?: number; // Rotation offset between quadrants (in radians)
  // Standard mesh props
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

export function DeformableDisk({
  radius = 5,
  segments = 32,
  maxDisplacement = 4,
  frequencyMultiplier = 3.0,
  lerpFactor = 0.1,
  color = '#ffffff',
  wireframe = false,
  useVertexColors = true,
  quadrantRotation = Math.PI / 8, // 22.5 degrees offset between quadrants
  ...meshProps
}: DeformableDiskProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const previousPositions = useRef<Float32Array | null>(null);
  const previousColors = useRef<Float32Array | null>(null);
  const debugCounterRef = useRef(0);
  const rotationRef = useRef(0); // Track cumulative rotation
  
  // Access store values correctly
  const frequencyGridMap = useFreq530(state => state.values.frequencyGridMap);
  const low = useFreq530(state => state.values.low);
  const mid = useFreq530(state => state.values.mid);
  const high = useFreq530(state => state.values.high);
  const kick = useFreq530(state => state.values.kick);
  const beatIntensity = useFreq530(state => state.values.beatIntensity);
  const amplitude = useFreq530(state => state.values.amplitude);

  // Create circular geometry with vertex colors
  const { geometry, initialPositions } = useMemo(() => {
    // Create custom cone-like geometry with concentric rings
    const geo = new THREE.BufferGeometry();
    
    const rings = 10; // Number of concentric rings from center to edge
    const angularSegments = segments; // Number of angular divisions
    
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    
    // Add center vertex
    positions.push(0, 0, 0);
    uvs.push(0.5, 0.5);
    
    // Create concentric rings
    for (let ring = 1; ring <= rings; ring++) {
      const ringRadius = (ring / rings) * radius;
      
      for (let segment = 0; segment < angularSegments; segment++) {
        const angle = (segment / angularSegments) * Math.PI * 2;
        const x = Math.cos(angle) * ringRadius;
        const y = Math.sin(angle) * ringRadius;
        
        positions.push(x, y, 0);
        
        // UV coordinates for texture mapping
        const u = (x / radius + 1) * 0.5;
        const v = (y / radius + 1) * 0.5;
        uvs.push(u, v);
      }
    }
    
    // Create triangular faces
    // Connect center to first ring
    for (let segment = 0; segment < angularSegments; segment++) {
      const nextSegment = (segment + 1) % angularSegments;
      
      indices.push(
        0, // center
        1 + segment,
        1 + nextSegment
      );
    }
    
    // Connect rings to each other
    for (let ring = 0; ring < rings - 1; ring++) {
      for (let segment = 0; segment < angularSegments; segment++) {
        const nextSegment = (segment + 1) % angularSegments;
        
        const currentRingStart = 1 + ring * angularSegments;
        const nextRingStart = 1 + (ring + 1) * angularSegments;
        
        const a = currentRingStart + segment;
        const b = currentRingStart + nextSegment;
        const c = nextRingStart + segment;
        const d = nextRingStart + nextSegment;
        
        // Create two triangles for each quad
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
    
    // Set geometry attributes
    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    
    // Add vertex colors attribute
    const colors = new Float32Array(positions.length);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Set dynamic draw usage for both position and color
    (geo.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (geo.attributes.color as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    
    geo.computeVertexNormals();
    
    const initialPos = new Float32Array(positions);
    return { geometry: geo, initialPositions: initialPos };
  }, [radius, segments]);

  // Create material with vertex colors support
  // const material = useMemo(() => {
  //   if (useVertexColors) {
  //     return new THREE.MeshBasicMaterial({ 
  //       vertexColors: true,
  //       wireframe,
  //       transparent: true,
  //       opacity: 0.8,
  //       side: THREE.DoubleSide // Show both sides of the disk
  //     });
  //   } else {
  //     return new THREE.MeshBasicMaterial({ 
  //       color,
  //       wireframe,
  //       transparent: true,
  //       opacity: 0.8,
  //       side: THREE.DoubleSide
  //     });
  //   }
  // }, [color, wireframe, useVertexColors]);

  // Helper function to determine which quadrant a point belongs to
  const getQuadrant = (x: number, y: number): number => {
    if (x >= 0 && y >= 0) return 0; // Top-right
    if (x < 0 && y >= 0) return 1;  // Top-left
    if (x < 0 && y < 0) return 2;   // Bottom-left
    return 3; // Bottom-right
  };

  // Helper function to apply rotation to coordinates for each quadrant
  const getRotatedCoords = (x: number, y: number, quadrant: number): [number, number] => {
    const rotationAngle = quadrant * quadrantRotation;
    const cos = Math.cos(rotationAngle);
    const sin = Math.sin(rotationAngle);
    
    return [
      x * cos - y * sin,
      x * sin + y * cos
    ];
  };

  useFrame(() => {
    debugCounterRef.current++;
    
    if (!meshRef.current || !initialPositions) {
      if (debugCounterRef.current % 60 === 0) {
        console.log('❌ NO MESH OR INITIAL POSITIONS (DISK)');
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
      console.log('🔧 INITIALIZED DISK PREVIOUS POSITIONS:', positions.count, 'vertices');
    }
    
    if (!previousColors.current && useVertexColors) {
      previousColors.current = new Float32Array(colors.count * 3);
      console.log('🎨 INITIALIZED DISK VERTEX COLORS:', colors.count, 'vertices');
    }

    if (!frequencyGridMap || frequencyGridMap.length === 0) {
      // When no frequency data is available, ensure disk remains flat
      for (let i = 0; i < positions.count; i++) {
        const currentZ = previousPositions.current[i * 3 + 2];
        const targetZ = 0; // Target flat disk when no data
        
        // Smoothly return to flat state
        const newZ = currentZ + (targetZ - currentZ) * (lerpFactor * 2);
        
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
      
      if (debugCounterRef.current % 120 === 0) {
        console.log('🔇 NO FREQUENCY DATA: Disk returning to flat state');
      }
      return;
    }

    // Map frequency grid values to disk vertices
    const gridSize = 16; // Assuming 16x16 = 256 grid
    const rings = 10; // Must match the rings count from geometry creation
    let hasValidData = false;
    
    // Calculate center vertex displacement based on frequency data average
    let centerDisplacement = 0;
    if (frequencyGridMap && frequencyGridMap.length > 0) {
      const avgFrequency = frequencyGridMap.reduce((a: number, b: number) => a + b, 0) / frequencyGridMap.length;
      centerDisplacement = avgFrequency * maxDisplacement * frequencyMultiplier * 0.6; // 60% of average for center
    }

    for (let i = 0; i < positions.count; i++) {
      // Get vertex position in local coordinates
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      // Handle center vertex (index 0) - position based on average frequency
      if (i === 0) {
        const currentZ = previousPositions.current[i * 3 + 2];
        const newZ = currentZ + (centerDisplacement - currentZ) * lerpFactor;
        positions.setZ(i, newZ);
        previousPositions.current[i * 3 + 2] = newZ;
        if (useVertexColors && previousColors.current) {
          colors.setXYZ(i, 0.5, 0.5, 1.0); // Center gets a nice blue
          previousColors.current[i * 3] = 0.5;
          previousColors.current[i * 3 + 1] = 0.5;
          previousColors.current[i * 3 + 2] = 1.0;
        }
        continue;
      }
      
      // Calculate which ring and segment this vertex belongs to
      const vertexIndex = i - 1; // Subtract 1 for center vertex
      const ring = Math.floor(vertexIndex / segments) + 1; // Which ring (1-10)
      const segment = vertexIndex % segments; // Which segment in the ring
      
      // Determine which quadrant this vertex belongs to
      const quadrant = getQuadrant(x, y);
      
      // Apply quadrant-specific rotation to the coordinates
      const [rotatedX, rotatedY] = getRotatedCoords(x, y, quadrant);
      
      // Normalize coordinates to [0, 1] range for grid mapping
      const normalizedX = (rotatedX / radius + 1) * 0.5;
      const normalizedY = (rotatedY / radius + 1) * 0.5;
      
      // Map to frequency grid coordinates
      const gridX = Math.floor(normalizedX * (gridSize - 1));
      const gridY = Math.floor(normalizedY * (gridSize - 1));
      const gridIndex = Math.min(Math.max(gridY * gridSize + gridX, 0), frequencyGridMap.length - 1);
      
      // Get frequency data for this grid position
      const frequencyValue = frequencyGridMap[gridIndex] || 0;
      
      if (frequencyValue > 0) {
        hasValidData = true;
      }
      
      // Vinyl-like displacement calculation
      const ringFactor = ring / rings; // 0.1 to 1.0 from center to edge
      const baseHeight = frequencyValue * maxDisplacement * frequencyMultiplier;
      
      // Create vinyl-like waves: subtle variation based on ring position
      const radialWave = Math.sin(ringFactor * Math.PI * 4) * 0.3 + 1.0; // Subtle radial waves
      const vinylMultiplier = 0.2 + ringFactor * 1.8; // Dramatic increase toward edge (0.2 to 2.0)
      const targetZ = baseHeight * vinylMultiplier * radialWave;
      
      // Get current position and smoothly interpolate
      const currentZ = previousPositions.current[i * 3 + 2];
      const newZ = currentZ + (targetZ - currentZ) * lerpFactor;
      
      // Update position
      positions.setZ(i, newZ);
      previousPositions.current[i * 3 + 2] = newZ;
      
      // Calculate vertex colors based on audio parameters, quadrant, and ring
      if (useVertexColors && previousColors.current) {
        // Base colors from audio parameters
        const redChannel = Math.min(1.0, kick * beatIntensity * 2.0);
        const greenChannel = Math.min(1.0, mid * amplitude * 1.5);
        const blueChannel = Math.min(1.0, high * 3.0);
        
        // Add quadrant-specific color modulation
        const quadrantColorMod = [
          [1.0, 0.8, 0.6], // Q0: Red-orange tint
          [0.6, 1.0, 0.8], // Q1: Green tint
          [0.8, 0.6, 1.0], // Q2: Blue-purple tint
          [1.0, 1.0, 0.6]  // Q3: Yellow tint
        ][quadrant];
        
        // Add ring-based color intensity (inner rings brighter)
        const ringIntensity = 1.0 + (1.0 - ringFactor) * 0.2; // Subtle intensity variation (1.0 to 1.2x)
        
        // Add frequency-specific modulation
        const freqModulation = Math.min(1.0, frequencyValue * 2.0);
        const finalR = Math.min(1.0, (redChannel + freqModulation * 0.3) * quadrantColorMod[0] * ringIntensity);
        const finalG = Math.min(1.0, (greenChannel + freqModulation * 0.2) * quadrantColorMod[1] * ringIntensity);
        const finalB = Math.min(1.0, (blueChannel + freqModulation * 0.4) * quadrantColorMod[2] * ringIntensity);
        
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

    // Add vinyl-like rotation based on audio
    if (meshRef.current) {
      // Calculate rotation speed based on audio intensity
      const rotationSpeed = (amplitude * 0.5 + beatIntensity * 0.3 + low * 0.2) * 0.02;
      rotationRef.current += rotationSpeed;
      
      // Apply rotation to the mesh
      meshRef.current.rotation.z = rotationRef.current;
    }

    // Enhanced debug logging
    if (debugCounterRef.current % 60 === 0 && hasValidData) {
      const sampleFreq = frequencyGridMap[0] || 0;
      const maxFreq = Math.max(...frequencyGridMap);
      const avgFreq = frequencyGridMap.reduce((a: number, b: number) => a + b, 0) / frequencyGridMap.length;
      
      console.log('🎵 DISK FREQUENCY DATA (VINYL):', {
        gridSize: `${gridSize}x${gridSize}`,
        radius,
        segments,
        rings: 10,
        totalVertices: positions.count,
        quadrants: 4,
        quadrantRotation: `${(quadrantRotation * 180 / Math.PI).toFixed(1)}°`,
        rotation: `${(rotationRef.current * 180 / Math.PI).toFixed(1)}°`,
        sampleValue: sampleFreq.toFixed(4),
        maxValue: maxFreq.toFixed(4),
        avgValue: avgFreq.toFixed(4),
        maxDisplacement,
        frequencyMultiplier,
        effectiveMultiplier: (maxDisplacement * frequencyMultiplier).toFixed(2),
        vinylStructure: 'Spinning disk with radial waves + even displacement',
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
    <group position={[0, -8, 3]}>
    <pointLight position={[0, 0, 10]} intensity={100} />
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      // material={material}
      {...meshProps}
    >
      <meshPhysicalMaterial 
        color={"orange"}
        wireframe={wireframe}
        transparent={true}
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
    </group>
  );
} 