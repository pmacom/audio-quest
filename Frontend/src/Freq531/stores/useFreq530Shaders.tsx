import { create } from 'zustand'
import * as THREE from 'three'
import { ShaderSettings } from '../types'
import { TEST_SHADER } from '../shaders/test-shader'
import { AMAZING_SHADER_AI } from '../shaders/amazing-shader-ai'

export interface ShaderTextureState {
  shaders: ShaderSettings[],
  textureRefs: Record<string, React.MutableRefObject<THREE.Texture | null>>,
  setShaderTextureRef: (id: string, ref: React.MutableRefObject<THREE.Texture | null>) => void,
  getShaderTextureRef: (id: string) => React.MutableRefObject<THREE.Texture | null> | undefined,
  addShader: (shader: ShaderSettings) => void,
  removeShader: (id: string) => void,
  setShaders: (shaders: ShaderSettings[]) => void,
}

export const useShaderTexture = create<ShaderTextureState>((set, get) => ({
  shaders: [
    // TEST_SHADER,
    AMAZING_SHADER_AI,
  ],
  textureRefs: {},
  setShaders: (shaders: ShaderSettings[]) => {
    set({ shaders })
  },
  setShaderTextureRef: (id, ref) => {
    set(state => ({ textureRefs: { ...state.textureRefs, [id]: ref } }))
  },
  getShaderTextureRef: (id) => {
    return get().textureRefs[id]
  },
  addShader: (shader: ShaderSettings) => {
    set({ shaders: [...get().shaders, shader] })
  },
  removeShader: (id: string) => {
    set({ shaders: get().shaders.filter((shader) => shader.id !== id) })
  }
}))

