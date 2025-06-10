"use client"

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei'
import { Suspense } from 'react'
import { FastTrippyMaterialsOnly } from '../shaders/PerformantShaderManager'
import { SimpleBirdModel } from '../../models/SimpleBirdModel'
import { SimpleTrippyMaterial } from '../shaders/SimpleTrippyMaterial'

// Simple example with just the raw shader material - no presets, no complexity
export const SimpleTrippyExample = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {/* Optimized shader manager */}
      <FastTrippyMaterialsOnly />
      
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <OrbitControls enablePan enableZoom enableRotate />
        
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        
        <Stats />
        
        <Suspense fallback={null}>
          {/* Simple bird with trippy material - no material style complexity */}
          <SimpleBirdModel 
            position={[0, 0, 0]}
            scale={2}
            enableTrippyMaterial={true}
          />
          
          {/* Simple cube with trippy material */}
          <SimpleTrippyMaterial>
            <mesh position={[4, 0, 0]}>
              <boxGeometry args={[1.5, 1.5, 1.5]} />
            </mesh>
          </SimpleTrippyMaterial>

          {/* Simple sphere with trippy material */}
          <SimpleTrippyMaterial>
            <mesh position={[-4, 0, 0]}>
              <sphereGeometry args={[1, 16, 16]} />
            </mesh>
          </SimpleTrippyMaterial>
        </Suspense>
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        maxWidth: '300px'
      }}>
        <h4>Simple Trippy Materials</h4>
        <p>✅ Just the raw shader texture applied to objects</p>
        <p>✅ No material style presets</p>
        <p>✅ No audio dependency</p>
        <p>✅ No complex configuration</p>
        <p>✅ Clean and simple</p>
      </div>
    </div>
  )
}

export default SimpleTrippyExample 