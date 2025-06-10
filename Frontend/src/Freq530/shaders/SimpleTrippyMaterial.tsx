import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useShaderCacheStore } from './store/useShaderCacheStore';

interface SimpleTrippyMaterialProps {
  children: React.ReactNode;
  shaderId?: string;
  fallbackColor?: string;
}

/**
 * Simple trippy material that just applies the shader texture to objects.
 * No presets, no complexity - just the raw shader material.
 */
export const SimpleTrippyMaterial = ({
  children,
  shaderId = "trip-video-material",
  fallbackColor = "#ff6b6b",
}: SimpleTrippyMaterialProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const originalMaterials = useRef(new Map<THREE.Mesh, THREE.Material | THREE.Material[]>());
  
  // Get shader texture from cache
  const shaderTexture = useShaderCacheStore(state => state.textures[shaderId]);
  
  // Create simple material - just the shader texture on a basic material
  const trippyMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: fallbackColor,
      side: THREE.DoubleSide,
    });

    // Apply shader texture as map if available
    if (shaderTexture) {
      material.map = shaderTexture;
      material.needsUpdate = true;
    }

    return material;
  }, [shaderTexture, fallbackColor]);

  // Apply material to all meshes
  useEffect(() => {
    if (!groupRef.current) return;

    const applyMaterial = (object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        // Store original material for cleanup
        if (!originalMaterials.current.has(object)) {
          originalMaterials.current.set(object, object.material);
        }
        
        // Apply simple trippy material
        object.material = trippyMaterial;
      }
      
      object.children.forEach(applyMaterial);
    };

    applyMaterial(groupRef.current);

    // Cleanup: restore original materials
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

  // Update texture when available
  useEffect(() => {
    if (shaderTexture && trippyMaterial.map !== shaderTexture) {
      trippyMaterial.map = shaderTexture;
      trippyMaterial.needsUpdate = true;
    }
  }, [shaderTexture, trippyMaterial]);

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}; 