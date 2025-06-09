import React, { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { ShaderManager } from '../shaders/ShaderManager'
import { PRIMARY_SCENE_CONTENT } from '../PRIMARY_SCENE_CONTENT'
import { DebugFreq530 } from '../debug/DebugFreq530'
import { useFreq530 } from '../audio/store/useFreq530'
import { PostProcessAudioEffects } from './PostProcessAudioEffects'

interface BasicTestCanvasProps {
  children?: React.ReactNode
  debug?: boolean
}

export const BasicTestCanvas = ({ children, debug }: BasicTestCanvasProps) => {
  // Initialize WebSocket connection for audio data
  const connectWebSocket = useFreq530(state => state.connectWebSocket)
  const connectionState = useFreq530(state => state.connectionState)
  
  useEffect(() => {
    if (connectionState === 'idle') {
      connectWebSocket()
    }
  }, [connectWebSocket, connectionState])

  return (
    <>
      <div className="w-screen h-screen fixed top-0 left-0 z-[1] text-black">
        <Canvas camera={{ position: [0, 8, 12], fov: 50 }} gl={{ alpha: true }}>
          <Stats />
          <ambientLight intensity={0.6} />
          <color attach="background" args={["#333333"]} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, 10, -10]} intensity={0.5} />
          <OrbitControls makeDefault />
          {children}
          {/* <PostProcessAudioEffects /> */}
        </Canvas>
      </div>
      {debug && <DebugFreq530 />}
    </>
  )
}


