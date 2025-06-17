import { useMemo } from 'react';
import * as THREE from 'three';
import { useShaderCacheStore } from '../shaders/store/useShaderCacheStore';
import { JSX } from 'react';

export type CachedMeshProps = JSX.IntrinsicElements['mesh'] & {
  shaderId: string;
  geometry?: THREE.BufferGeometry;
};

// CachedMesh: Box with MeshStandardMaterial, texture as diffuse map
export const CachedMesh = ({
  shaderId,
  geometry,
  ...props
}: CachedMeshProps) => {
  const textures = useShaderCacheStore(s => s.textures);
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

  const scale = 50

  return (
    <mesh {...props} scale={[scale, scale, scale]}>
      {geometry ? <primitive object={geometry} attach="geometry" /> : <sphereGeometry args={[1, 32, 32]} />}
      <primitive object={material} attach="material" />
    </mesh>
  );
};

// CachedMesh2: Torus knot with MeshStandardMaterial, texture as diffuse map
export const CachedMesh2 = ({
  shaderId,
  geometry,
  ...props
}: CachedMeshProps) => {
  const textures = useShaderCacheStore(s => s.textures);
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
      {geometry ? <primitive object={geometry} attach="geometry" /> : <torusKnotGeometry args={[0.4, 0.1, 100, 16]} />}
      <primitive object={material} attach="material" />
    </mesh>
  );
};

// CachedMesh3: Plane with MeshStandardMaterial, texture as normal map
export const CachedMesh3 = ({
  shaderId,
  geometry,
  ...props
}: CachedMeshProps) => {
  const textures = useShaderCacheStore(s => s.textures);
  const texture = textures[shaderId] || null;

  const material = useMemo(() => {
    if (!texture) return null;
    return new THREE.MeshStandardMaterial({
      normalMap: texture,
      color: 'white',
      metalness: 0.5,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
  }, [texture]);

  if (!material) return null;

  return (
    <mesh {...props}>
      {geometry ? <primitive object={geometry} attach="geometry" /> : <planeGeometry args={[2, 2]} />}
      <primitive object={material} attach="material" />
    </mesh>
  );
};

// CachedMesh4: Sphere with MeshStandardMaterial, texture as roughness map
export const CachedMesh4 = ({
  shaderId,
  geometry,
  ...props
}: CachedMeshProps) => {
  const textures = useShaderCacheStore(s => s.textures);
  const texture = textures[shaderId] || null;

  const material = useMemo(() => {
    if (!texture) return null;
    return new THREE.MeshStandardMaterial({
      roughnessMap: texture,
      metalness: 0.5,
      roughness: 0.5,
      color: 'silver',
      side: THREE.DoubleSide,
    });
  }, [texture]);

  if (!material) return null;

  return (
    <mesh {...props}>
      {geometry ? <primitive object={geometry} attach="geometry" /> : <sphereGeometry args={[0.5, 32, 32]} />}
      <primitive object={material} attach="material" />
    </mesh>
  );
};