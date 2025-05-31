import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { ShaderSettings } from '../types'
import { useShaderTexture } from '../stores/useFreq530Shaders'

interface ShaderTextureRendererProps {
  shader: ShaderSettings,
  isAnimated?: boolean,
}

export const ShaderTextureRenderer = ({ shader, isAnimated = false }: ShaderTextureRendererProps) => {
  const { gl } = useThree()
  const setTextureRef = useShaderTexture((state) => state.setTextureRef)
  const removeTextureRef = useShaderTexture((state) => state.removeTextureRef)

  const textureRef = useRef<THREE.Texture | null>(null)
  const frameCount = useRef(0)
  
  const scene = useMemo(() => new THREE.Scene(), [])
  const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10), [])
  const target = useMemo(
    () =>
      new THREE.WebGLRenderTarget(500, 500, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
      }),
    []
  )

  const plane = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
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
    }),
    []
  )

  const vertexShader = shader.vertexShader
  const fragmentShader = shader.fragmentShader

  useEffect(() => {
    camera.position.z = 1
    if (plane.current) {
      scene.add(plane.current)
    }

    // Register the texture ref in the store
    textureRef.current = target.texture
    setTextureRef(shader.id, textureRef)
    console.log(`[ShaderTextureRenderer] Initialized shader ${shader.id}, textureRef created:`, textureRef.current)

    return () => {
      scene.remove(plane.current!)
      target.dispose()
      removeTextureRef(shader.id)
      console.log(`[ShaderTextureRenderer] Cleanup for shader ${shader.id}`)
    }
  }, [scene, camera, target, shader.id, setTextureRef, removeTextureRef])

  useEffect(() => {
    if (!isAnimated) {
      // Render once for static shaders
      gl.setRenderTarget(target)
      gl.render(scene, camera)
      gl.setRenderTarget(null)
      console.log(`[ShaderTextureRenderer] Static render for shader ${shader.id}`)
    }
  }, [gl, scene, camera, target, isAnimated])

  useFrame(({ clock }) => {
    if (isAnimated && materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      gl.setRenderTarget(target)
      gl.render(scene, camera)
      gl.setRenderTarget(null)
      
      frameCount.current++
      if (frameCount.current % 60 === 0) { // Log every 60 frames
        console.log(`[ShaderTextureRenderer] Frame update for shader ${shader.id}, time:`, clock.getElapsedTime())
      }
    }
  })

  
  return (
    <>
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        map={textureRef.current}
        transparent={true}
      />
    </mesh>

      {/* <mesh
        ref={plane}
        position={[0, 0, 0]}
        frustumCulled={false}
      >
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>


      <mesh position={[-5, 0, 0]}>
        <planeGeometry args={[5, 5]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh> */}
    </>
  )
}
