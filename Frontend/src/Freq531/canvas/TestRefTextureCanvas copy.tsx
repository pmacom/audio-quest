// shaderCacheStore.ts
import { create } from 'zustand'
import React, { JSX, useEffect, useMemo, useState, useRef } from 'react'
import { useThree, useFrame, Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, useFBO, TorusKnot } from '@react-three/drei'

import * as THREE from 'three'
import { TEST_SHADER } from '../shaders/test-shader'

export const TestRefTextureCanvas = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="w-screen h-screen fixed top-0 left-0 z-[200] bg-black">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <Stats />
        <ambientLight />
        <color attach="background" args={["#333333"]} />
        <pointLight position={[10, 10, 10]} />

        <OrbitControls makeDefault />

        
        {/* PROBLEM: RED SPHERE ABOVE IS NOT VISIBILE WHEN THE BELOW COMPONENT IS RENDERED */}
        <CachedShaderTest />
        <DebugFBOTexture />
      </Canvas>
    </div>
  )
}

const CachedShaderTest = () => {
  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
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
    };
  }, []);

  useFrame(({ clock }) => {
    uniforms.uAdjustedAccumulatedTime.value = clock.getElapsedTime();
  });

  return (
    <>
      <CachedShader
        shader={{
          vertexShader: TEST_SHADER.vertexShader,
          fragmentShader: TEST_SHADER.fragmentShader,
          uniforms: uniforms
        }}
      />
      <TorusKnotWithCachedTexture position={[2, 0, 0]} />
      <TorusKnotWithCachedTexture position={[-2, 0, 0]} />
      <TorusKnotWithCachedTexture position={[0, 2, 0]} />
      <TorusKnotWithCachedTexture position={[0, -2, 0]} />
      <TorusKnotWithCachedTexture position={[0, 0, 2]} />
      <TorusKnotWithCachedTexture position={[0, 0, -2]} />
    </>
  )
}

const TorusKnotWithCachedTexture = ({ position }: { position: [number, number, number] }) => {
  const texture = useShaderCacheStore(s => s.texture)
  if (!texture) return null
  return (
    <mesh position={position}>
      <torusKnotGeometry args={[1, 0.3, 128, 32]} />
      <meshBasicMaterial wireframe map={texture} toneMapped={false} />
    </mesh>
  )
}

const DebugFBOTexture = () => {
  const texture = useShaderCacheStore(s => s.texture)
  React.useEffect(() => {
    if (texture) console.log('cached texture:', texture)
  }, [texture])
  if (!texture) return null
  return (
    <mesh position={[0,0,0]}>
      <planeGeometry args={[2,2]} />
      <meshBasicMaterial map={texture} toneMapped={false}/>
    </mesh>
  )
}

/** @public Store rendered shader texture for reuse */
export interface ShaderCacheStore {
  texture?: THREE.Texture
  setTexture: (tex: THREE.Texture) => void
}

export const useShaderCacheStore = create<ShaderCacheStore>(set => ({
  texture: undefined,
  setTexture: tex => set({ texture: tex }),
}))


/** @param shader ShaderMaterialParameters for offscreen render */
export const CachedShader = ({
  shader,
  width = 1024,
  height = 1024,
}: {
  shader: THREE.ShaderMaterialParameters
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
    const mat = new THREE.ShaderMaterial(shader)
    s.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat))
    return { s, mat }
  }, [shader])
  const camera = useMemo(
    () => {
      const cam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10)
      cam.position.set(0, 0, 1)
      cam.lookAt(0, 0, 0)
      return cam
    },
    []
  )
  const setTexture = useShaderCacheStore(s => s.setTexture)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const prev = gl.autoClear
    gl.autoClear = false
    return () => { gl.autoClear = prev }
  }, [gl])

  // Animate uTime uniform if present
  useFrame(({ clock }) => {
    if (scene.mat.uniforms && scene.mat.uniforms.uTime) {
      scene.mat.uniforms.uTime.value = clock.getElapsedTime();
    }
    gl.setRenderTarget(fbo);
    gl.clear();
    gl.render(scene.s, camera);
    gl.setRenderTarget(null);
    setTexture(fbo.texture);
  }, -1);

  return null
}

/** Simple mesh that uses cached texture */
export const CachedMesh = (props: JSX.IntrinsicElements['mesh'] & {
  geometry?: THREE.BufferGeometry,
  useTexture?: boolean
}) => {
  const texture = useShaderCacheStore(s => s.texture)
  if (props.useTexture && texture) {
    return (
      <mesh {...props}>
        {props.geometry ? <primitive object={props.geometry} /> : <boxGeometry args={[1, 1, 1]} />}
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    )
  }
  // fallback: wireframe
  return (
    <mesh {...props}>
      {props.geometry ? <primitive object={props.geometry} /> : <boxGeometry args={[1, 1, 1]} />}
      <meshBasicMaterial color="lime" wireframe toneMapped={false} />
    </mesh>
  )
}
