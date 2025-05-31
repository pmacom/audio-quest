import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { TEST_SHADER } from './test-shader'
import { useShaderTexture } from '../stores/useFreq530Shaders'
import { useFreq530 } from '../stores/useFreq530'

export const TestUseTexture = () => {
  const { gl } = useThree()
  // Create a virtual scene and camera for the portal
  const virtualScene = useMemo(() => new THREE.Scene(), [])
  const camera = useMemo(() => new THREE.PerspectiveCamera(75, 1, 0.1, 1000), [])
  const renderTarget = useMemo(
    () => new THREE.WebGLRenderTarget(512, 512, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat }),
    []
  )
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const textureRef = useRef<THREE.Texture | null>(renderTarget.texture)
  const setShaderTextureRef = useShaderTexture(s => s.setShaderTextureRef)
  const audioState = useFreq530(state => state.values);

  // Set up camera position
  useEffect(() => {
    camera.position.z = 10
  }, [camera])

  // Store the texture ref in Zustand
  useEffect(() => {
    setShaderTextureRef('test-shader', textureRef)
  }, [setShaderTextureRef])

  // Animate shader uniforms and render the virtual scene to the render target
  useFrame(({ clock }) => {
    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      const t = clock.getElapsedTime()
      const period = 50;
      const min = -10;
      const max = 10;
      const amplitude = (max - min) / 2; // 50
      const mid = (max + min) / 4;       // 50

      shaderMaterialRef.current.uniforms.uTime.value = t;
      shaderMaterialRef.current.uniforms.TWEAK_3.value = Math.cos((2 * Math.PI * t) / period) * amplitude + mid;
      shaderMaterialRef.current.uniforms.TWEAK_6.value = ((audioState.adjustedTime - audioState.time) / 5) + clock.getElapsedTime()
      shaderMaterialRef.current.uniforms.TWEAK_8.value = audioState.sinNormal + (3 * audioState.kickDynamic) // (audioState.sinNormal /2 ) + .5
    }
    gl.setRenderTarget(renderTarget)
    gl.render(virtualScene, camera)
    gl.setRenderTarget(null)
  })

  // Set the map only when the texture ref changes
  useEffect(() => {
    if (materialRef.current && textureRef?.current) {
      materialRef.current.map = textureRef.current
      materialRef.current.needsUpdate = true
    }
  }, [textureRef?.current])

  // Shader uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(512, 512) },
    uAdjustedAccumulatedTime: { value: 1.0 },
    TWEAK_1: { value: 1.0 },
    TWEAK_2: { value: 1.0 },
    TWEAK_3: { value: 1.0 },
    TWEAK_4: { value: 1.0 },
    TWEAK_5: { value: 1.0 },
    TWEAK_6: { value: 1.0 },
    TWEAK_7: { value: 1.0 },
    TWEAK_8: { value: 1.0 },
    TWEAK_9: { value: 1.0 },
    TWEAK_10: { value: 1.0 }
  }), [])

  return (
    <>
      {/* Render the plane with the shader into the virtual scene */}
      <mesh>
        <planeGeometry args={[20, 20]} />
        <shaderMaterial
          ref={shaderMaterialRef}
          uniforms={uniforms}
          vertexShader={TEST_SHADER.vertexShader}
          fragmentShader={TEST_SHADER.fragmentShader}
        />
      </mesh>
    </>
  )
}