import { useMemo } from 'react';
import * as THREE from 'three';
import { useShaderVideoCacheStore } from '../stores/useShaderVideoCacheStore';
import { JSX } from 'react';

export type CachedVideoMeshProps = JSX.IntrinsicElements['mesh'] & {
  shaderId: string;
  geometry?: THREE.BufferGeometry;
};

// CachedMesh: Box with MeshStandardMaterial, texture as diffuse map
export const CachedVideoMesh = ({
  shaderId,
  geometry,
  ...props
}: CachedVideoMeshProps) => {
  const textures = useShaderVideoCacheStore(s => s.textures);
  const texture = textures[shaderId] || null;

  const material = useMemo(() => {
    if (!texture) return null;
    return new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.5,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
  }, [texture]);

  if (!material) return null;

  return (
    <mesh {...props}>
      {geometry ? <primitive object={geometry} attach="geometry" /> : <boxGeometry args={[1, 1, 1]} />}
      <primitive object={material} attach="material" />
    </mesh>
  );
};
