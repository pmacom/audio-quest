import { create } from 'zustand'
import React, { JSX, useEffect, useMemo, useState } from 'react'
import { useThree, useFrame, Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, useFBO, TorusKnot } from '@react-three/drei'
import * as THREE from 'three'
import { AMAZING_SHADER_AI } from '../shaders/amazing-shader-ai'
import { useFreq530 } from '../stores/useFreq530'

// Define the ShaderSettings interface (assuming this is its structure)
export interface ShaderSettings {
  id: string
  isActive: boolean
  name: string
  vertexShader: string
  fragmentShader: string
  ranges: any // Replace with actual type if known
}

// Updated ShaderCacheStore to handle multiple textures
export interface ShaderCacheStore {
  textures: { [key: string]: THREE.Texture }
  setTexture: (id: string, tex: THREE.Texture) => void
}

export const useShaderCacheStore = create<ShaderCacheStore>(set => ({
  textures: {},
  setTexture: (id: string, tex: THREE.Texture) => set(state => ({
    textures: { ...state.textures, [id]: tex }
  })),
}))

export const TestRefTextureCanvas = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="w-screen h-screen fixed top-0 left-0 z-[200] bg-black">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <Stats />
        <ambientLight />
        <color attach="background" args={["#333333"]} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls makeDefault />


        <CachedShaderTest />
        <DebugFBOTexture id="amazing-shader-ai" />
      </Canvas>
    </div>
  )
}

const CachedShaderTest = () => {
  const uniforms1 = useMemo(() => ({
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(400, 400) },
    uAdjustedAccumulatedTime: { value: 1.0 },
    TWEAK_1: { value: 1.0 },
    TWEAK_2: { value: 1.0 },
    TWEAK_3: { value: 1.0 },
    TWEAK_4: { value: 1.0 },
    TWEAK_5: { value: 1.0 },
    TWEAK_6: { value: 1.0 },
    TWEAK_7: { value: 1.0 },
    TWEAK_8: { value: 1.0 },
    TWEAK_9: { value: 1.0 },
    TWEAK_10: { value: 1.0 }
  }), [])

  useFrame(({ clock }) => {
    const audioState = useFreq530.getState().values
    const t = clock.getElapsedTime()
    const period = 50;
    const min = -10;
    const max = 10;
    const amplitude = (max - min) / 2; // 50
    const mid = (max + min) / 4;       // 50

    uniforms1.uTime.value = t;
    uniforms1.TWEAK_2.value = (audioState.amplitudeDynamic / 30) + (audioState.sinNormal * 1)
    uniforms1.TWEAK_3.value = Math.cos((2 * Math.PI * t) / period) * amplitude + mid;
    uniforms1.TWEAK_6.value = ((audioState.adjustedTime - audioState.time) / 5) + clock.getElapsedTime()
    uniforms1.TWEAK_8.value = audioState.sinNormal + (2 * audioState.kickDynamic) // (audioState.sinNormal /2 ) + .5
    uniforms1.TWEAK_9.value = audioState.amplitudeDynamic
  })

  return (
    <>
      <CachedShader
        id="amazing-shader-ai"
        shader={{
          vertexShader: AMAZING_SHADER_AI.vertexShader,
          fragmentShader: AMAZING_SHADER_AI.fragmentShader,
        }}
        uniforms={uniforms1}
      />
      <TorusKnotWithCachedTexture id="amazing-shader-ai" position={[2, 0, 0]} />
      {/* <TorusKnotWithCachedTexture id="test-shader" position={[-2, 0, 0]} />
      <TorusKnotWithCachedTexture id="test-shader" position={[0, 2, 0]} />
      <TorusKnotWithCachedTexture id="test-shader" position={[0, -2, 0]} />
      <TorusKnotWithCachedTexture id="test-shader" position={[0, 0, 2]} />
      <TorusKnotWithCachedTexture id="test-shader" position={[0, 0, -2]} /> */}
    </>
  )
}

const TorusKnotWithCachedTexture = ({ id, position }: { id: string, position: [number, number, number] }) => {
  const texture = useShaderCacheStore(s => s.textures[id])
  if (!texture) return null
  return (
    <mesh position={position}>
      <torusKnotGeometry args={[1, 0.3, 128, 32]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

const DebugFBOTexture = ({ id }: { id: string }) => {
  const texture = useShaderCacheStore(s => s.textures[id])
  React.useEffect(() => {
    if (texture) console.log(`cached texture for id ${id}:`, texture)
  }, [texture, id])
  if (!texture) return null
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

export const CachedShader = ({
  id,
  shader,
  uniforms,
  width = 1024,
  height = 1024,
}: {
  id: string
  shader: {
    vertexShader: string
    fragmentShader: string
  }
  uniforms: Record<string, THREE.IUniform>
  width?: number
  height?: number
}) => {
  const { gl } = useThree()
  const fbo = useFBO(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  })
  const scene = useMemo(() => {
    const s = new THREE.Scene()
    const mat = new THREE.ShaderMaterial({
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      uniforms: uniforms,
    })
    s.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat))
    return { s, mat }
  }, [shader.vertexShader, shader.fragmentShader, uniforms])
  const camera = useMemo(() => {
    const cam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10)
    cam.position.set(0, 0, 1)
    cam.lookAt(0, 0, 0)
    return cam
  }, [])
  const setTexture = useShaderCacheStore(s => s.setTexture)

  useEffect(() => {
    const prev = gl.autoClear
    gl.autoClear = false
    return () => { gl.autoClear = prev }
  }, [gl])

  useFrame(({ clock }) => {
    if (scene.mat.uniforms.uTime) {
      scene.mat.uniforms.uTime.value = clock.getElapsedTime()
    }
    gl.setRenderTarget(fbo)
    gl.clear()
    gl.render(scene.s, camera)
    gl.setRenderTarget(null)
    setTexture(id, fbo.texture)
  }, -1)

  return null
}

export const CachedMesh = (props: JSX.IntrinsicElements['mesh'] & {
  id?: string
  geometry?: THREE.BufferGeometry
  useTexture?: boolean
}) => {
  const texture = useShaderCacheStore(s => props.id ? s.textures[props.id] : undefined)
  if (props.useTexture && props.id && texture) {
    return (
      <mesh {...props}>
        {props.geometry ? <primitive object={props.geometry} /> : <boxGeometry args={[1, 1, 1]} />}
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    )
  }
  return (
    <mesh {...props}>
      {props.geometry ? <primitive object={props.geometry} /> : <boxGeometry args={[1, 1, 1]} />}
      <meshBasicMaterial color="lime" wireframe toneMapped={false} />
    </mesh>
  )
}