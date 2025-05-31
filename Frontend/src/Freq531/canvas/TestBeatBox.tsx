import { useRef } from "react"
import { useFreq530 } from "../stores/useFreq530"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export const TestBeatBox = () => {
  
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const audioState = useFreq530.getState().values
    if (ref.current) {
      ref.current.scale.x = audioState.kickDynamic + 5
      ref.current.scale.y = audioState.snareDynamic + 2
      ref.current.scale.z = audioState.hihatDynamic + 5
    }
  })

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="orange" />
    </mesh>
  )
}