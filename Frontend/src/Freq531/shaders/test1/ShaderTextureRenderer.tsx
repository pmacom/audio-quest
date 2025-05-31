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
  const textureRef = useShaderTexture((state) => state.textureRefs)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const vertexShader = shader.vertexShader
  const fragmentShader = shader.fragmentShader

  const uniforms = useMemo(
    () => ({
      uAdjustedTime: { value: 0 },
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

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uAdjustedTime.value += 0.01
    }
  })

  return (
    <>
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>

      {/*
      
        <mesh
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
        </mesh>
      
      */}
    </>
  )
}
