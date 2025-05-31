import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from 'three';
import { useCachedShader } from "./useFreq530Shaders";
import { TEST_SHADER } from "../test-shader";
import { useFrame } from "@react-three/fiber";

export const CachedTest = () => {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const cachedShaders = useCachedShader(s => s.shaders)
  const getCachedShaderTextureRef = useCachedShader(s => s.getShaderTextureRef)

  const cashedTextureRef = useMemo(() => {
    if(!cachedShaders) return null
    const ref = getCachedShaderTextureRef(TEST_SHADER.id)
    if(!ref) {
      console.log('no ref')
      return null
    } else {
      console.log('I got a ref', ref)
      return ref.current
    }
  },[cachedShaders])

  const [cashedTexture, setCashedTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if(!materialRef || !materialRef.current) return
    console.log('I got a material')
    if(!cachedShaders) return
    console.log('I got a cached shaders', cachedShaders)
    console.log('I got a shader texture')
    // setCashedTexture(shaderTextureRef.current)
  }, [cachedShaders, materialRef, cashedTexture])

  useFrame(() => {
    if(!cashedTexture || !materialRef.current) return
    console.log(cashedTexture)
    materialRef.current.map = cashedTexture
    materialRef.current.needsUpdate = true
  })

  return (
    <mesh>
      <sphereGeometry args={[2, 32, 32]} />
      {/* <meshStandardMaterial ref={materialRef} color="red" /> */}
      <meshBasicMaterial ref={materialRef} color="white" />
    </mesh>
  )
}