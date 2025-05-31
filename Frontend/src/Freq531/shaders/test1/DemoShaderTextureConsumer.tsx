import { useRef, useEffect } from 'react'
import { useShaderTexture } from '../stores/useFreq530Shaders'
import * as THREE from 'three'

interface DemoShaderTextureConsumerProps {
  shaderId: string
  position?: [number, number, number]
  geometry?: React.ReactNode
}

export const DemoShaderTextureConsumer = ({
  shaderId,
  position = [0, 0, 0],
  geometry = <sphereGeometry args={[1, 32, 32]} />
}: DemoShaderTextureConsumerProps) => {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const textureRef = useShaderTexture(state => state.getShaderTextureRef(shaderId))

  useEffect(() => {
    if (materialRef.current && textureRef?.current) {
      materialRef.current.map = textureRef.current
      materialRef.current.needsUpdate = true
    }
  }, [textureRef?.current])

  return (
    <mesh position={position}>
      {geometry}
      <meshBasicMaterial ref={materialRef} transparent />
    </mesh>
  )
} 