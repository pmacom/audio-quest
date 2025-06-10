import { useRef, useEffect, useMemo } from 'react';
import { useFrame, RootState } from '@react-three/fiber';
import * as THREE from 'three';
import { useShaderCacheStore } from './store/useShaderCacheStore';

interface TrippyMaterialProviderProps {
  children: React.ReactNode;
  shaderId?: string;
  fallbackColor?: string;
  materialProps?: {
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
  };
  // Audio-reactive scaling
  amplitudeScale?: {
    min: number;
    max: number;
  };
  // Control whether to use audio or time-based scaling
  useAudioReactivity?: boolean;
  // Manual scaling animation (used when audio is disabled)
  timeBasedScale?: {
    enabled: boolean;
    min: number;
    max: number;
    speed: number; // Animation speed multiplier
  };
}

export const TrippyMaterialProvider = ({
  children,
  shaderId = "trip-video-material",
  fallbackColor = "#ff6b6b",
  materialProps = {},
  amplitudeScale,
  useAudioReactivity = false,
  timeBasedScale = {
    enabled: true,
    min: 0.9,
    max: 1.1,
    speed: 1.0,
  },
}: TrippyMaterialProviderProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const originalMaterials = useRef<Map<THREE.Mesh, THREE.Material>>(new Map());
  
  // Get cached shader texture
  const shaderTexture = useShaderCacheStore(state => state.textures[shaderId]);
  
  // Audio state for reactive scaling (only if enabled)
  const amplitude = useAudioReactivity ? 
    // Lazy import to avoid dependency when not needed
    (() => {
      try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { useFreq530 } = require('../audio/store/useFreq530');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useFreq530(state => state.values.amplitude);
      } catch {
        return 0.5; // Fallback value
      }
    })() : 0.5;
  
  // Create the trippy material
  const trippyMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: fallbackColor,
      metalness: materialProps.metalness || 0.1,
      roughness: materialProps.roughness || 0.3,
      emissive: materialProps.emissive || "#000000",
      emissiveIntensity: materialProps.emissiveIntensity || 0.2,
      transparent: materialProps.transparent !== undefined ? materialProps.transparent : true,
      opacity: materialProps.opacity || 1.0,
      side: THREE.DoubleSide,
    });

    // Apply shader texture as map if available
    if (shaderTexture) {
      material.map = shaderTexture;
      material.needsUpdate = true;
    }

    return material;
  }, [
    shaderTexture,
    fallbackColor,
    materialProps.metalness,
    materialProps.roughness,
    materialProps.emissive,
    materialProps.emissiveIntensity,
    materialProps.transparent,
    materialProps.opacity,
  ]);

  // Apply material to all meshes in the group
  useEffect(() => {
    if (!groupRef.current) return;

    const applyMaterial = (object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        // Store original material if not already stored
        if (!originalMaterials.current.has(object)) {
          originalMaterials.current.set(object, object.material);
        }
        
        // Apply trippy material
        object.material = trippyMaterial;
      }
      
      // Recursively apply to children
      object.children.forEach(applyMaterial);
    };

    applyMaterial(groupRef.current);

    // Cleanup function to restore original materials
    return () => {
      if (groupRef.current) {
        const restoreMaterial = (object: THREE.Object3D) => {
          if (object instanceof THREE.Mesh) {
            const originalMaterial = originalMaterials.current.get(object);
            if (originalMaterial) {
              object.material = originalMaterial;
              originalMaterials.current.delete(object);
            }
          }
          object.children.forEach(restoreMaterial);
        };
        
        restoreMaterial(groupRef.current);
      }
    };
  }, [trippyMaterial]);

  // Update shader texture when it becomes available
  useEffect(() => {
    if (shaderTexture && trippyMaterial.map !== shaderTexture) {
      trippyMaterial.map = shaderTexture;
      trippyMaterial.needsUpdate = true;
    }
  }, [shaderTexture, trippyMaterial]);

  // Scaling animation (audio-reactive or time-based)
  useFrame((state) => {
    if (!groupRef.current) return;

    if (useAudioReactivity && amplitudeScale) {
      // Audio-reactive scaling
      const scale = amplitudeScale.min + (amplitude * (amplitudeScale.max - amplitudeScale.min));
      groupRef.current.scale.setScalar(scale);
    } else if (timeBasedScale.enabled) {
      // Time-based scaling animation
      const time = state.clock.elapsedTime * timeBasedScale.speed;
      const oscillation = Math.sin(time) * 0.5 + 0.5; // 0 to 1
      const scale = timeBasedScale.min + (oscillation * (timeBasedScale.max - timeBasedScale.min));
      groupRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
};

// Convenience component specifically for the trip video material
export const TripVideoMaterialProvider = ({
  children,
  useAudioReactivity = false,
  ...props
}: Omit<TrippyMaterialProviderProps, 'shaderId'>) => {
  return (
    <TrippyMaterialProvider
      shaderId="trip-video-material"
      fallbackColor="#ff6b6b"
      useAudioReactivity={useAudioReactivity}
      materialProps={{
        metalness: 0.1,
        roughness: 0.4,
        emissiveIntensity: 0.3,
        ...props.materialProps,
      }}
      {...props}
    >
      {children}
    </TrippyMaterialProvider>
  );
};

// Example usage component that shows different configurations
export const TrippyMaterialExamples = () => {
  return (
    <>
      {/* Basic trippy sphere with time-based scaling (no audio) */}
      <TripVideoMaterialProvider
        useAudioReactivity={false}
        timeBasedScale={{
          enabled: true,
          min: 0.8,
          max: 1.5,
          speed: 1.0,
        }}
        materialProps={{ 
          emissiveIntensity: 0.5,
          metalness: 0.2 
        }}
      >
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
        </mesh>
      </TripVideoMaterialProvider>

      {/* Highly metallic version with audio reactivity */}
      <TripVideoMaterialProvider
        useAudioReactivity={true}
        amplitudeScale={{ min: 0.5, max: 2.0 }}
        materialProps={{
          metalness: 0.8,
          roughness: 0.1,
          emissiveIntensity: 0.1,
        }}
      >
        <mesh position={[3, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      </TripVideoMaterialProvider>

      {/* Emissive glowing version with faster time animation */}
      <TripVideoMaterialProvider
        useAudioReactivity={false}
        timeBasedScale={{
          enabled: true,
          min: 1.0,
          max: 2.0,
          speed: 2.0,
        }}
        materialProps={{
          emissive: "#ff3333",
          emissiveIntensity: 1.0,
          metalness: 0.0,
          roughness: 0.8,
        }}
      >
        <mesh position={[-3, 0, 0]}>
          <torusGeometry args={[1, 0.3, 8, 16]} />
        </mesh>
      </TripVideoMaterialProvider>
    </>
  );
}; 