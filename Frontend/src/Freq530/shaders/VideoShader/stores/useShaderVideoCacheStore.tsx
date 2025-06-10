import { create } from 'zustand'
import * as THREE from 'three'
import { VideoShaderSettings } from '../types'
// Updated ShaderCacheStore to handle multiple textures
export interface ShaderCacheStore {
  shaders: { [key: string]: VideoShaderSettings };
  textures: { [key: string]: THREE.Texture };
  addShader: (shader: VideoShaderSettings) => void;
  removeShader: (shaderId: string) => void;
  setTexture: (shaderId: string, tex: THREE.Texture) => void;
}

export const useShaderVideoCacheStore = create<ShaderCacheStore>(set => ({
  shaders: {},
  textures: {},
  addShader: (shader: VideoShaderSettings) => {
    set(state => ({
      shaders: { ...state.shaders, [shader.id]: shader },
    }));
  },
  removeShader: (shaderId: string) => {
    set(state => {
      const { [shaderId]: _, ...restShaders } = state.shaders;
      const { [shaderId]: texture, ...restTextures } = state.textures;
      if (texture) {
        texture.dispose(); // Clean up texture
      }
      return {
        shaders: restShaders,
        textures: restTextures,
      };
    });
  },
  setTexture: (shaderId: string, tex: THREE.Texture) => {
    set(state => ({
      textures: { ...state.textures, [shaderId]: tex },
    }));
  },
}));