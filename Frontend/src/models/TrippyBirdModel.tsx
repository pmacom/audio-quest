"use client"

import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { GLTF } from 'three-stdlib'
import { TripVideoMaterialProvider } from '../Freq530/shaders/TrippyMaterialProvider'

// Type definition for the GLTF model
type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Object3D>
  materials: Record<string, THREE.Material>
  animations: THREE.AnimationClip[]
}

interface TrippyBirdModelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  audioReactive?: boolean
  animationSpeed?: number
  // Trippy material options
  enableTrippyMaterial?: boolean
  materialStyle?: 'standard' | 'metallic' | 'emissive' | 'glass'
  // Audio-reactive scaling
  amplitudeScaling?: {
    enabled: boolean
    min: number
    max: number
  }
  // Time-based scaling (fallback when audio is disabled)
  timeBasedScaling?: {
    enabled: boolean
    min: number
    max: number
    speed: number
  }
  // Audio-reactive animation speed
  audioAnimationSpeed?: {
    enabled: boolean
    baseSpeed: number
    amplitudeMultiplier: number
  }
}

const MATERIAL_PRESETS = {
  standard: {
    metalness: 0.1,
    roughness: 0.4,
    emissiveIntensity: 0.3,
    transparent: false,
    opacity: 1.0,
  },
  metallic: {
    metalness: 0.8,
    roughness: 0.1,
    emissiveIntensity: 0.1,
    transparent: false,
    opacity: 1.0,
  },
  emissive: {
    metalness: 0.0,
    roughness: 0.8,
    emissive: "#ff3333",
    emissiveIntensity: 1.0,
    transparent: false,
    opacity: 1.0,
  },
  glass: {
    metalness: 0.0,
    roughness: 0.0,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.7,
  },
};

export function TrippyBirdModel({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1,
  audioReactive = false,
  animationSpeed = 1.0,
  enableTrippyMaterial = true,
  materialStyle = 'standard',
  amplitudeScaling = {
    enabled: false,
    min: 0.8,
    max: 1.5,
  },
  timeBasedScaling = {
    enabled: true,
    min: 0.9,
    max: 1.1,
    speed: 1.0,
  },
  audioAnimationSpeed = {
    enabled: false,
    baseSpeed: 1.0,
    amplitudeMultiplier: 2.0,
  },
}: TrippyBirdModelProps) {
  const group = useRef<THREE.Group>(null!)
  const { nodes, materials, animations, scene } = useGLTF('/models/bird.glb') as GLTFResult
  const { actions, mixer } = useAnimations(animations, group)
  
  // Audio state for reactive behavior (only if enabled)
  let amplitude = 0.5;
  let beatIntensity = 0.5;
  
  if (audioReactive) {
    try {
      // Lazy import to avoid dependency when not needed
      const { useFreq530 } = require('../Freq530/audio/store/useFreq530');
      const audioState = useFreq530();
      amplitude = audioState.values.amplitude;
      beatIntensity = audioState.values.beatIntensity;
    } catch (error) {
      console.warn('Audio system not available, using default values');
    }
  }

  // Initialize animations
  useEffect(() => {
    if (animations.length > 0) {
      // Play the first animation by default
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
      if (audioReactive && audioAnimationSpeed.enabled) {
        // Audio-reactive animation speed
        const dynamicSpeed = audioAnimationSpeed.baseSpeed + (amplitude * audioAnimationSpeed.amplitudeMultiplier)
        mixer.timeScale = dynamicSpeed * animationSpeed
      } else {
        // Standard animation update
        mixer.timeScale = animationSpeed
      }
      
      mixer.update(delta)
    }

    // Optional: Audio-reactive rotation (only if audio is enabled)
    if (audioReactive && group.current) {
      // Subtle rotation based on beat intensity
      group.current.rotation.y += beatIntensity * 0.01
    } else if (group.current && timeBasedScaling.enabled) {
      // Time-based rotation fallback
      group.current.rotation.y += 0.005 * timeBasedScaling.speed
    }
  })

  const materialProps = MATERIAL_PRESETS[materialStyle]

  // Regular bird model without trippy material
  if (true) {
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

  // Bird model with trippy material
  return (
    <TripVideoMaterialProvider
      materialProps={materialProps}
      useAudioReactivity={audioReactive}
      amplitudeScale={audioReactive && amplitudeScaling.enabled ? amplitudeScaling : undefined}
      timeBasedScale={timeBasedScaling}
    >
      <group 
        ref={group} 
        position={position} 
        rotation={rotation}
        scale={scale}
        dispose={null}
      >
        <primitive object={scene} />
      </group>
    </TripVideoMaterialProvider>
  )
}

// Preload the model for better performance
useGLTF.preload('/models/bird.glb')

// Export variations for convenience
export const StandardTrippyBird = (props: Omit<TrippyBirdModelProps, 'materialStyle'>) => (
  <TrippyBirdModel materialStyle="standard" {...props} />
)

export const MetallicTrippyBird = (props: Omit<TrippyBirdModelProps, 'materialStyle'>) => (
  <TrippyBirdModel materialStyle="metallic" {...props} />
)

export const EmissiveTrippyBird = (props: Omit<TrippyBirdModelProps, 'materialStyle'>) => (
  <TrippyBirdModel materialStyle="emissive" {...props} />
)

export const GlassTrippyBird = (props: Omit<TrippyBirdModelProps, 'materialStyle'>) => (
  <TrippyBirdModel materialStyle="glass" {...props} />
)

// Example scene showing different configurations
export const TrippyBirdShowcase = () => {
  return (
    <>
      {/* Standard trippy bird with time-based animation (no audio) */}
      <StandardTrippyBird 
        position={[0, 0, 0]}
        audioReactive={false}
        timeBasedScaling={{
          enabled: true,
          min: 0.8,
          max: 1.2,
          speed: 1.0,
        }}
      />
      
      {/* Metallic bird with audio reactivity */}
      <MetallicTrippyBird 
        position={[5, 0, 0]}
        audioReactive={true}
        amplitudeScaling={{
          enabled: true,
          min: 1.0,
          max: 2.0,
        }}
      />
      
      {/* Emissive glowing bird with faster time animation */}
      <EmissiveTrippyBird 
        position={[-5, 0, 0]}
        audioReactive={false}
        timeBasedScaling={{
          enabled: true,
          min: 0.5,
          max: 1.8,
          speed: 2.0,
        }}
      />
      
      {/* Glass-like transparent bird with audio animation speed */}
      <GlassTrippyBird 
        position={[0, 5, 0]}
        audioReactive={true}
        audioAnimationSpeed={{
          enabled: true,
          baseSpeed: 0.5,
          amplitudeMultiplier: 3.0,
        }}
      />
      
      {/* Regular bird without trippy material for comparison */}
      <TrippyBirdModel 
        position={[0, -5, 0]}
        enableTrippyMaterial={false}
        audioReactive={false}
      />
    </>
  )
}

// Export default for convenience
export default TrippyBirdModel 