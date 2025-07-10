import React, { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { EffectComposer } from '@react-three/postprocessing'
import { ShaderManager } from '../shaders/ShaderManager'
import { PRIMARY_SCENE_CONTENT } from '../PRIMARY_SCENE_CONTENT'
import { DebugFreq530 } from '../debug/DebugFreq530'
import { useFreq530 } from '../audio/store/useFreq530'
import { PostProcessAudioEffects } from './PostProcessAudioEffects'

// Simple test component to verify bloom works
const BloomTestCube = () => {
  const amplitude = useFreq530(state => state.values.amplitude || 0);
  
  return (
    <mesh position={[5, 2, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial 
        color={[2 + amplitude * 10, 2 + amplitude * 10, 2 + amplitude * 10]} // Bright white that should bloom
        toneMapped={false} // Important: prevent tone mapping from reducing brightness
      />
    </mesh>
  );
};

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
      <div className="w-screen h-screen fixed top-0 left-0 z-[1] text-black bg-black">
        <Canvas camera={{ position: [0, 8, 12], fov: 50 }} gl={{ alpha: true }}>
          <Stats />
          <ambientLight intensity={0.6} />
          <color attach="background" args={["#000"]} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, 10, -10]} intensity={0.5} />
          <OrbitControls makeDefault />
          
          {/* Test cube to verify bloom is working */}
          <BloomTestCube />
          
          {children}
          <EffectComposer>
            <PostProcessAudioEffects />
          </EffectComposer>
        </Canvas>
      </div>
      {debug && <DebugFreq530 />}
    </>
  )
}


