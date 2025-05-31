import { useRef } from "react"
import { useFreq530 } from "../stores/useFreq530"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"

export const DisplaySpectogramCubes = () => {
  const quantizedBands = useFreq530(state => state.values.quantizedBands)
  const cubeSize = 0.1
  const refs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(() => {
    if (quantizedBands && refs.current.length) {
      quantizedBands.forEach((val, i) => {
        const mesh = refs.current[i]
        if (mesh) {
          mesh.scale.y = 1 // Math.max(0.01, (val ?? 0) * 4) / 100 // Only scale height
          mesh.scale.x = 1
          mesh.scale.z = 1
        }
      })
    }
  })

  return (
    <group>
      {quantizedBands && quantizedBands.length > 0 && quantizedBands.map((val, i) => {
        const height = Math.max(0.01, (val ?? 0) * .1) * cubeSize
        return (
          <mesh
            key={i}
            ref={el => (refs.current[i] = el)}
            position={[i * cubeSize, height / 2, 0]} // Raise bar so it grows upward
          >
            <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
            <meshStandardMaterial color={"orange"} />
          </mesh>
        )
      })}
    </group>
  )
}