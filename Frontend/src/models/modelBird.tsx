"use client"

import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { GLTF } from 'three-stdlib'
import { useFreq530 } from '../Freq530/audio/store/useFreq530'

// Type definition for the GLTF model
type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Object3D>
  materials: Record<string, THREE.Material>
  animations: THREE.AnimationClip[]
}

interface BirdModelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  audioReactive?: boolean
  animationSpeed?: number
}

export function BirdModel({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1,
  audioReactive = true,
  animationSpeed = 1.0
}: BirdModelProps) {
  const group = useRef<THREE.Group>(null!)
  const { nodes, materials, animations, scene } = useGLTF('/models/bird.glb') as GLTFResult
  const { actions, mixer } = useAnimations(animations, group)
  
  // Audio state for reactive behavior
  const audioState = useFreq530()

  // Initialize animations
  useEffect(() => {
    if (animations.length > 0) {
      // Play the first animation by default, or you can specify which one
      const firstAnimation = Object.keys(actions)[0]
      if (firstAnimation && actions[firstAnimation]) {
        actions[firstAnimation]!.play()
        // Loop the animation
        actions[firstAnimation]!.setLoop(THREE.LoopRepeat, Infinity)
      }
      
      // If there are multiple animations, you can control them individually
      // Example: actions['FlyingAnimation']?.play()
      // actions['IdleAnimation']?.play()
    }
  }, [actions, animations])


  return (
    <group 
      ref={group} 
      position={position} 
      rotation={rotation}
      scale={scale}
      dispose={null}
    >
      <primitive object={scene} />
    </group>
  )
}

// Preload the model for better performance
useGLTF.preload('/models/bird.glb')

// Export default for convenience
export default BirdModel

// Named export for specific use cases
export { BirdModel as AnimatedBird }
