import { create } from 'zustand'
import React, { JSX, useEffect, useMemo, useRef } from 'react'
import { useThree, useFrame, Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, useFBO } from '@react-three/drei'
import * as THREE from 'three'
import { AMAZING_SHADER_AI } from '../shaders/amazing-shader-ai'
import { useFreq530 } from '../stores/useFreq530'
import { TestBeatBox } from './TestBeatBox'
import { DisplaySpectogramCubes } from '../displays/display-spectogram-cubes'
import { AMAZING_SHADER_AI_2 } from '../shaders/amazing-shader-ai-2'
import { TEST_SHADER } from '../shaders/test-shader'
import { AMAZING_SHADER_AI_3 } from '../shaders/amazing-shader-ai-3'
import { AMAZING_SHADER_AI_5 } from '../shaders/amazing-shader-ai-5'
import { AMAZING_SHADER_AI_4 } from '../shaders/amazing-shader-ai-4'
import { AMAZING_SHADER_AI_6 } from '../shaders/amazing-shader-ai-6'

const DEFAULT_CACHE_SIZE = 500

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
  setTexture: (id: string, tex: THREE.Texture) => {
    console.log('[setTexture] called with', id, tex);
    set(state => {
      const newTextures = { ...state.textures, [id]: tex };
      console.log('[setTexture] new textures object:', newTextures);
      return { textures: newTextures };
    });
  },
}))

// FINDME
// Centralized list of all available shaders
const SHADERS: ShaderSettings[] = [
  TEST_SHADER,
  AMAZING_SHADER_AI,
  AMAZING_SHADER_AI_2,
  AMAZING_SHADER_AI_3,
  AMAZING_SHADER_AI_4,
  AMAZING_SHADER_AI_5,
  AMAZING_SHADER_AI_6,
]

// ShaderSelect component: lets user pick a shader from the list
interface ShaderSelectProps {
  shaders: ShaderSettings[]
  selectedShaderId: string
  onChange: (id: string) => void
}

const ShaderSelect: React.FC<ShaderSelectProps> = ({ shaders, selectedShaderId, onChange }) => {
  return (
    <div
      className="fixed left-1/2 top-2 -translate-x-1/2 flex flex-row items-center gap-2 bg-black/80 rounded-md text-white z-[1000] px-2 py-1 shadow"
      style={{ minWidth: 220 }}
    >
      <label htmlFor="shader-select" className="font-semibold mr-2 text-white">Shader:</label>
      <select
        id="shader-select"
        value={selectedShaderId}
        onChange={e => onChange(e.target.value)}
        className="bg-neutral-900 text-white rounded px-1 py-0.5 text-sm border border-neutral-700 focus:outline-none"
        style={{ minWidth: 100 }}
      >
        {shaders.map(shader => (
          <option key={shader.id} value={shader.id}>{shader.name}</option>
        ))}
      </select>
      <button
        className="ml-2 px-2 py-0.5 rounded bg-green-700 hover:bg-green-800 text-xs font-bold"
        style={{ minWidth: 28 }}
        onClick={() => alert('Add Shader: In the future, this will open a GLSL input for AI conversion!')}
        type="button"
      >
        +
      </button>
      <button
        className="ml-1 px-2 py-0.5 rounded bg-red-700 hover:bg-red-800 text-xs font-bold disabled:opacity-50"
        style={{ minWidth: 28 }}
        onClick={() => {
          // Remove shader logic will be handled in parent
          const event = new CustomEvent('remove-shader', { detail: selectedShaderId });
          window.dispatchEvent(event);
        }}
        type="button"
        disabled={shaders.length <= 1}
      >
        –
      </button>
    </div>
  )
}

export const TestRefTextureCanvas = ({ children }: { children?: React.ReactNode }) => {
  const [shaders, setShaders] = React.useState(SHADERS)
  const [selectedShaderId, setSelectedShaderId] = React.useState(SHADERS[0].id)
  const selectedShader = shaders.find(s => s.id === selectedShaderId) || shaders[0]

  // Listen for remove-shader event from ShaderSelect
  React.useEffect(() => {
    const handler = (e: any) => {
      const id = e.detail
      if (shaders.length > 1) {
        const idx = shaders.findIndex(s => s.id === id)
        const newShaders = shaders.filter(s => s.id !== id)
        setShaders(newShaders)
        // If the removed shader was selected, select the next one or the first
        if (selectedShaderId === id) {
          setSelectedShaderId(newShaders[Math.max(0, idx - 1)]?.id || newShaders[0].id)
        }
      }
    }
    window.addEventListener('remove-shader', handler as any)
    return () => window.removeEventListener('remove-shader', handler as any)
  }, [shaders, selectedShaderId])

  return (
    <div className="w-screen h-screen fixed top-0 left-0 z-[1] bg-black">
      <ShaderSelect shaders={shaders} selectedShaderId={selectedShaderId} onChange={setSelectedShaderId} />
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <Stats />
        <ambientLight />
        <color attach="background" args={["#333333"]} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls makeDefault />

        {/* <TestBeatBox /> */}

        {/* <DisplaySpectogramCubes /> */}

        <CachedShaderTest selectedShader={AMAZING_SHADER_AI_2} />
        <group position={[-1, 3, 0]}>
        <CachedShaderTest selectedShader={AMAZING_SHADER_AI} />
        </group>

        <group position={[-5, -1, 0]}>
        <CachedShaderTest selectedShader={AMAZING_SHADER_AI_3} />
        </group>

        <group position={[4, 2, 1]}>
        <CachedShaderTest selectedShader={AMAZING_SHADER_AI_4} />
        </group>

        {/* <TorusKnotWithCachedTexture position={[1,1,0]} id={"amazing-shader-ai-v1"} />
        <TorusKnotWithCachedTexture position={[0, 0, 0]} id={"amazing-shader-ai-v2"} />
        <TorusKnotWithCachedTexture position={[0, 1, 1]} id={"amazing-shader-ai-v3"} />
        <TorusKnotWithCachedTexture position={[1, -1, 0]} id={"amazing-shader-ai-v4"} /> */}

        <DebugFBOTexture id={"amazing-shader-ai-v1"} />
        <DebugFBOTexture id={"amazing-shader-ai-v2"} />
        <DebugFBOTexture id={"amazing-shader-ai-v3"} />
        <DebugFBOTexture id={"amazing-shader-ai-v4"} />

        {/* <DebugFBOTexture id={"amazing-shader-ai-v3"} />
        <DebugFBOTexture id={"amazing-shader-ai-v4"} />
        <DebugFBOTexture id={"amazing-shader-ai-v5"} />
        <DebugFBOTexture id={"amazing-shader-ai-v6"} /> */}



      </Canvas>
    </div>
  )
}

const CachedShaderTest = ({ selectedShader }: { selectedShader: ShaderSettings }) => {
  const uniforms1 = useMemo(() => ({
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(10, 10) },
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
        id={selectedShader.id}
        shader={{
          vertexShader: selectedShader.vertexShader,
          fragmentShader: selectedShader.fragmentShader,
        }}
        uniforms={uniforms1}
      />
      <TorusKnotWithCachedTexture id={selectedShader.id} position={[2, 0, 0]} />
    </>
  )
}

const TorusKnotWithCachedTexture = ({ id, position }: { id: string, position: [number, number, number] }) => {
  const textures = useShaderCacheStore(s => s.textures)
  console.log('TorusKnotWithCachedTexture textures:', textures)
  const texture = textures[id]
  if (!texture) return null
  return (
    <mesh position={position}>
      <torusKnotGeometry args={[1, 0.3, 128, 32]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  )
}

const DebugFBOTexture = ({ id }: { id: string }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useShaderCacheStore(s => s.textures[id])
  const low = useFreq530.getState().values.low

  React.useEffect(() => {
    if (texture) console.log(`cached texture for id ${id}:`, texture)
  }, [texture, id])
  if (!texture) return null

//   useFrame(() => {
// if(!meshRef.current) return
// meshRef.current.scale.set(low, low, low)
//   })


  return (
    <mesh ref={meshRef} position={[
      (Math.random()*8)-4,
      (Math.random()*10)-5,
      (Math.random()*20)-10
    ]}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

export const CachedShader = ({
  id,
  shader,
  uniforms,
  width = DEFAULT_CACHE_SIZE,
  height = DEFAULT_CACHE_SIZE,
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
    console.log('[CachedShader] setTexture called for', id, fbo.texture)
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