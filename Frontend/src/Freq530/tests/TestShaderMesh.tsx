import { useMemo } from "react"
import { useThree } from "@react-three/fiber"
import { useShaderSettings } from "../stores/useShaderSettings"
import { TweakShaderMaterial } from "../shaders/TweakShaderMaterial"
import { useAspect } from '@react-three/drei'

export const TestShaderMesh = () => {
  const { shaderSettings, selectedShaderId } = useShaderSettings()
  const shader = shaderSettings[selectedShaderId]
  const viewport = useThree(state => state.viewport)

  return (
    <mesh scale={[viewport.width, viewport.height, 1]} position={[0, 0, 0]}>
      <planeGeometry />
      <TweakShaderMaterial shader={shader}/>
    </mesh>
  )
}

