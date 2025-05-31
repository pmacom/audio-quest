import { useEffect, useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useShaderTexture } from '../stores/useFreq530Shaders'
import { ShaderSettings } from '../types'

interface ShaderTextureProviderProps {
  shader: ShaderSettings
  width?: number
  height?: number
}

export const ShaderTextureProvider = ({ shader, width = 512, height = 512 }: ShaderTextureProviderProps) => {
  const { gl } = useThree()
  const renderTarget = useRef<THREE.WebGLRenderTarget>(
    new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    })
  )
  const textureRef = useRef<THREE.Texture | null>(renderTarget.current.texture)
  const setShaderTextureRef = useShaderTexture(s => s.setShaderTextureRef)

  // Scene and camera for offscreen rendering
  const scene = useMemo(() => new THREE.Scene(), [])
  const camera = useMemo(() => {
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    cam.position.z = 1
    return cam
  }, [])

  // Plane with shader material
  const meshRef = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(() => ({
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(width, height) },
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
  }), [width, height])

  // Add mesh to scene once
  useEffect(() => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader
      })
    )
    meshRef.current = mesh
    scene.add(mesh)
    return () => {
      scene.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
      renderTarget.current.dispose()
    }
  }, [scene, shader, uniforms])

  // Store the texture ref in Zustand
  useEffect(() => {
    setShaderTextureRef(shader.id, textureRef)
  }, [setShaderTextureRef, shader.id])

  // Animate and render to target every frame
  useFrame(({ clock }) => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.getElapsedTime()
      gl.setRenderTarget(renderTarget.current)
      gl.render(scene, camera)
      gl.setRenderTarget(null)
    }
  })

  return null // This is a headless provider
} 