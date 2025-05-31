import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useShaderTexture } from "../stores/useFreq530Shaders";
import { useFrame } from "@react-three/fiber";
export const TestSphereRenderer = () => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const planeMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const textureRef = useShaderTexture(state => state.getShaderTextureRef('test-shader'));

  // Set the map only when the texture ref changes
  useEffect(() => {
    console.log('update')
    if (materialRef.current && textureRef?.current) {
      materialRef.current.map = textureRef.current;
      materialRef.current.needsUpdate = true;
    }
    if (planeMaterialRef.current && textureRef?.current) {
      planeMaterialRef.current.map = textureRef.current;
      planeMaterialRef.current.needsUpdate = true;
    }
  }, [textureRef?.current]);

  useFrame(() => {
    if (materialRef.current && textureRef?.current) {
      materialRef.current.map = textureRef.current;
      materialRef.current.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Sphere using the shared texture */}
      <mesh ref={sphereRef} position={[-2, 0, .2]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="red" ref={materialRef} />
      </mesh>
      {/* Plane using the same shared texture for UV comparison */}
      <mesh ref={planeRef} position={[2, 0, .2]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial color="white" ref={planeMaterialRef} />
      </mesh>
    </>
  );
};