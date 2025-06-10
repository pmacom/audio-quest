"use client"

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import type { GLTF } from 'three-stdlib'
import { SimpleTrippyMaterial } from '../Freq530/shaders/SimpleTrippyMaterial'

type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Object3D>
  materials: Record<string, THREE.Material>
  animations: THREE.AnimationClip[]
}

interface SimpleBirdModelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  animationSpeed?: number
  enableTrippyMaterial?: boolean
}

export function SimpleBirdModel({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1,
  animationSpeed = 1.0,
  enableTrippyMaterial = true,
}: SimpleBirdModelProps) {
  const group = useRef<THREE.Group>(null!)
  const { nodes, materials, animations, scene } = useGLTF('/models/bird.glb') as GLTFResult
  const { actions, mixer } = useAnimations(animations, group)

  // Initialize animations
  useEffect(() => {
    if (animations.length > 0) {
      const firstAnimation = Object.keys(actions)[0]
      if (firstAnimation && actions[firstAnimation]) {
        actions[firstAnimation]!.play()
        actions[firstAnimation]!.setLoop(THREE.LoopRepeat, Infinity)
      }
    }
  }, [actions, animations])

  // Animation updates
  useFrame((state, delta) => {
    if (mixer) {
      mixer.timeScale = animationSpeed
      mixer.update(delta)
    }

    // Simple rotation animation
    if (group.current) {
      group.current.rotation.y += 0.005
    }
  })

  // Regular bird model without trippy material
  if (!enableTrippyMaterial) {
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

  // Bird model with simple trippy material
  return (
    <SimpleTrippyMaterial>
      <group 
        ref={group} 
        position={position} 
        rotation={rotation}
        scale={scale}
        dispose={null}
      >
        <primitive object={scene} />
      </group>
    </SimpleTrippyMaterial>
  )
}

// Preload the model
useGLTF.preload('/models/bird.glb') 