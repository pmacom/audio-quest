import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { useRef } from "react"
import { Mesh } from "three"
import { useFreq530 } from "../stores/useFreq530"

export const BasicCanvas = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="w-screen h-screen fixed top-0 left-0 z-[-1] bg-black">
      <Canvas>
        <ambientLight />
        <color attach="background" args={["#000000"]} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />

        <KickSnareHihat />
        <LowMidHigh />
        
        {children}
      </Canvas>
    </div>
  )
}

const KickSnareHihat = () => {
  const kickRef = useRef<Mesh>(null)
  const snareRef = useRef<Mesh>(null)
  const hihatRef = useRef<Mesh>(null)

  const refs = useFreq530(s => s.refs)

  useFrame(() => {
    if (kickRef.current) {
      kickRef.current.position.y = refs.kickDynamic.current
    }
    if (snareRef.current) {
      snareRef.current.position.y = refs.snareDynamic.current
    }
    if (hihatRef.current) {
      hihatRef.current.position.y = refs.hihatDynamic.current
    }
  })

  return (
    <>
      <mesh ref={kickRef} position={[-1, 1, 1]}>
        <sphereGeometry />
        <meshBasicMaterial color="red" />
      </mesh>
      <mesh ref={snareRef} position={[0, 1, 1]}>
        <sphereGeometry />
        <meshBasicMaterial color="blue" />
      </mesh>
      <mesh ref={hihatRef} position={[1, 1, 1]}>
        <sphereGeometry />
        <meshBasicMaterial color="green" />
      </mesh>
    </>
  )
}

const LowMidHigh = () => {
  const lowRef = useRef<Mesh>(null)
  const midRef = useRef<Mesh>(null)
  const highRef = useRef<Mesh>(null)

  const refs = useFreq530(s => s.refs)

  useFrame(() => {
    if (lowRef.current) {
      lowRef.current.position.y = refs.lowDynamic.current
    }
    if (midRef.current) {
      midRef.current.position.y = refs.midDynamic.current
    }
    if (highRef.current) {
      highRef.current.position.y = refs.highDynamic.current
    }
  })

  return (
    <>
      <mesh ref={lowRef} position={[-1, 1, 1]}>
        <sphereGeometry />
        <meshBasicMaterial color="orange" />
      </mesh>
      <mesh ref={midRef} position={[0, 1, 1]}>
        <sphereGeometry />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh ref={highRef} position={[1, 1, 1]}>
        <sphereGeometry />
        <meshBasicMaterial color="yellow" />
      </mesh>
    </>
  )
}