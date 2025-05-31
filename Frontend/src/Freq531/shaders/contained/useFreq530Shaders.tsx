import { create } from 'zustand'
import * as THREE from 'three'
import { ShaderSettings } from '../../types'
import { TEST_SHADER } from '../test-shader'
import { RefObject } from 'react'

export interface CachedShaderState {
  shaders: ShaderSettings[],
  textureRefs: Record<string, RefObject<THREE.Texture | null>>,
  setShaderTextureRef: (id: string, ref: RefObject<THREE.Texture | null>) => void,
  getShaderTextureRef: (id: string) => RefObject<THREE.Texture | null> | undefined,
  addShader: (shader: ShaderSettings) => void,
  removeShader: (id: string) => void,
  setShaders: (shaders: ShaderSettings[]) => void,
}

export const useCachedShader = create<CachedShaderState>((set, get) => ({
  shaders: [
    TEST_SHADER,
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

