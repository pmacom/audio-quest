import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { ShaderManager } from '../shaders/ShaderManager'
import { PRIMARY_SCENE_CONTENT } from '../PRIMARY_SCENE_CONTENT'
import { DebugFreq530 } from '../debug/DebugFreq530'

interface BasicTestCanvasProps {
  children?: React.ReactNode
  debug?: boolean
}

export const BasicTestCanvas = ({ children, debug }: BasicTestCanvasProps) => {
  return (
    <>
      <div className="w-screen h-screen fixed top-0 left-0 z-[1] text-black">
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }} gl={{ alpha: true }}>
          <Stats />
          <ambientLight />
          <color attach="background" args={["#333333"]} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls makeDefault />
          <PRIMARY_SCENE_CONTENT />
        </Canvas>
      </div>
      {debug && <DebugFreq530 />}
    </>
  )
}


