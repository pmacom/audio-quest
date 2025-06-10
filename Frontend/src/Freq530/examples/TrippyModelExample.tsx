"use client"

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei'
import { Suspense } from 'react'
import { ShaderManager } from '../shaders/ShaderManager'
import { TrippyBirdShowcase, TrippyBirdModel } from '../../models/TrippyBirdModel'
import { TripVideoMaterialProvider } from '../shaders/TrippyMaterialProvider'

// Simple geometric shapes with trippy materials (no audio required)
const TrippyGeometry = () => {
  return (
    <>
      {/* Spinning cube with metallic trippy material */}
      <TripVideoMaterialProvider
        useAudioReactivity={false}
        materialProps={{
          metalness: 0.8,
          roughness: 0.2,
          emissiveIntensity: 0.4,
        }}
        timeBasedScale={{ 
          enabled: true, 
          min: 0.5, 
          max: 2.0, 
          speed: 1.5 
        }}
      >
        <mesh position={[10, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[2, 2, 2]} />
        </mesh>
      </TripVideoMaterialProvider>

      {/* Pulsing sphere with emissive material */}
      <TripVideoMaterialProvider
        useAudioReactivity={false}
        materialProps={{
          metalness: 0.0,
          roughness: 1.0,
          emissive: "#00ff88",
          emissiveIntensity: 1.5,
        }}
        timeBasedScale={{ 
          enabled: true, 
          min: 1.0, 
          max: 3.0, 
          speed: 2.0 
        }}
      >
        <mesh position={[-10, 0, 0]}>
          <sphereGeometry args={[1.5, 32, 32]} />
        </mesh>
      </TripVideoMaterialProvider>

      {/* Torus with glass-like material */}
      <TripVideoMaterialProvider
        useAudioReactivity={false}
        materialProps={{
          metalness: 0.1,
          roughness: 0.0,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.6,
        }}
        timeBasedScale={{ 
          enabled: true, 
          min: 0.8, 
          max: 1.5, 
          speed: 0.8 
        }}
      >
        <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2, 0.5, 16, 32]} />
        </mesh>
      </TripVideoMaterialProvider>
    </>
  )
}

// Loading fallback
const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#666" />
  </mesh>
)

export const TrippyModelExample = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {/* Shader processing happens here - renders to cached textures */}
      <ShaderManager />
      
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} />
        <OrbitControls enablePan enableZoom enableRotate />
        
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ff6b6b" />
        
        {/* Environment for reflections */}
        <Environment preset="night" />
        
        <Suspense fallback={<LoadingFallback />}>
          {/* Single trippy bird example - works without audio! */}
          <TrippyBirdModel 
            position={[0, 0, 0]}
            materialStyle="metallic"
            audioReactive={false} // Audio disabled
            timeBasedScaling={{
              enabled: true,
              min: 0.8,
              max: 1.8,
              speed: 1.2,
            }}
          />
          
          {/* Trippy geometric shapes - all work without audio */}
          <TrippyGeometry />
          
          {/* Full bird showcase (comment out if too many models) */}
          {/* <TrippyBirdShowcase /> */}
        </Suspense>
      </Canvas>
    </div>
  )
}

// Audio-enabled example (optional)
export const AudioTrippyBirdExample = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <ShaderManager />
      
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <OrbitControls />
        
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />
        
        <Suspense fallback={<LoadingFallback />}>
          {/* Audio-reactive bird - requires useFreq530 */}
          <TrippyBirdModel 
            position={[0, 0, 0]}
            scale={2}
            materialStyle="emissive"
            audioReactive={true} // Audio enabled
            amplitudeScaling={{
              enabled: true,
              min: 0.5,
              max: 2.5,
            }}
            audioAnimationSpeed={{
              enabled: true,
              baseSpeed: 1.0,
              amplitudeMultiplier: 3.0,
            }}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Simpler example with just one bird (no audio)
export const SimpleTrippyBirdExample = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <ShaderManager />
      
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <OrbitControls />
        
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />
        
        <Suspense fallback={<LoadingFallback />}>
          <TrippyBirdModel 
            position={[0, 0, 0]}
            scale={2}
            materialStyle="emissive"
            audioReactive={false} // No audio dependency
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default TrippyModelExample 