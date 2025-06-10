"use client"

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera, Stats } from '@react-three/drei'
import { Suspense } from 'react'
import { FastTrippyMaterialsOnly, BalancedTrippyMaterialsOnly } from '../shaders/PerformantShaderManager'
import { TrippyBirdModel } from '../../models/TrippyBirdModel'
import { TripVideoMaterialProvider } from '../shaders/TrippyMaterialProvider'

// Simple geometric shapes with trippy materials (optimized)
const OptimizedTrippyGeometry = () => {
  return (
    <>
      {/* Single cube - reduced geometry complexity */}
      <TripVideoMaterialProvider
        useAudioReactivity={false}
        materialProps={{
          metalness: 0.8,
          roughness: 0.2,
          emissiveIntensity: 0.4,
        }}
        timeBasedScale={{ 
          enabled: true, 
          min: 0.8, 
          max: 1.4, 
          speed: 1.0 
        }}
      >
        <mesh position={[5, 0, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
        </mesh>
      </TripVideoMaterialProvider>

      {/* Single sphere - reduced segments */}
      <TripVideoMaterialProvider
        useAudioReactivity={false}
        materialProps={{
          metalness: 0.0,
          roughness: 1.0,
          emissive: "#00ff88",
          emissiveIntensity: 1.0,
        }}
        timeBasedScale={{ 
          enabled: true, 
          min: 0.9, 
          max: 1.3, 
          speed: 1.5 
        }}
      >
        <mesh position={[-5, 0, 0]}>
          <sphereGeometry args={[1, 16, 16]} /> {/* Reduced from 32,32 to 16,16 */}
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

// High-performance example
export const FastTrippyModelExample = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {/* Use fast shader manager - updates every 4th frame, capped at 30fps */}
      <FastTrippyMaterialsOnly />
      
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} />
        <OrbitControls enablePan enableZoom enableRotate />
        
        {/* Simplified lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        
        {/* Performance stats */}
        <Stats />
        
        <Suspense fallback={<LoadingFallback />}>
          {/* Single optimized trippy bird */}
          <TrippyBirdModel 
            position={[0, 0, 0]}
            scale={1.5}
            materialStyle="metallic"
            audioReactive={false}
            timeBasedScaling={{
              enabled: true,
              min: 0.9,
              max: 1.2,
              speed: 0.8,
            }}
          />
          
          {/* Minimal geometry */}
          <OptimizedTrippyGeometry />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Balanced performance example
export const BalancedTrippyModelExample = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {/* Use balanced shader manager - updates every other frame, capped at 60fps */}
      <BalancedTrippyMaterialsOnly />
      
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} />
        <OrbitControls enablePan enableZoom enableRotate />
        
        {/* Standard lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#ff6b6b" />
        
        {/* Environment for reflections */}
        <Environment preset="night" />
        
        {/* Performance stats */}
        <Stats />
        
        <Suspense fallback={<LoadingFallback />}>
          {/* Trippy bird with balanced settings */}
          <TrippyBirdModel 
            position={[0, 0, 0]}
            materialStyle="metallic"
            audioReactive={false}
            timeBasedScaling={{
              enabled: true,
              min: 0.8,
              max: 1.5,
              speed: 1.0,
            }}
          />
          
          {/* Trippy geometric shapes */}
          <OptimizedTrippyGeometry />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Performance comparison example
export const PerformanceComparisonExample = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      {/* You can switch between these to test performance */}
      <FastTrippyMaterialsOnly />
      {/* <BalancedTrippyMaterialsOnly /> */}
      {/* <QualityTrippyMaterialsOnly /> */}
      
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <OrbitControls />
        
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />
        
        {/* Stats to monitor performance */}
        <Stats showPanel={0} className="stats" />
        
        <Suspense fallback={<LoadingFallback />}>
          <TrippyBirdModel 
            position={[0, 0, 0]}
            scale={2}
            materialStyle="emissive"
            audioReactive={false}
          />
        </Suspense>
      </Canvas>
      
      {/* Performance tips overlay */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        maxWidth: '300px'
      }}>
        <h4>Performance Modes:</h4>
        <p><strong>Fast:</strong> 30fps shader updates, lower resolution</p>
        <p><strong>Balanced:</strong> 60fps shader updates, full resolution</p>
        <p><strong>Quality:</strong> 120fps shader updates, full resolution</p>
        <p>Switch between modes in the code to test performance impact.</p>
      </div>
    </div>
  )
}

export default FastTrippyModelExample 