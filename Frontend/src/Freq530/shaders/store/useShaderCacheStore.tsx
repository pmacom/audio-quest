import { create } from 'zustand'
import * as THREE from 'three'

// Define the ShaderSettings interface (assuming this is its structure)
export interface ShaderSettings {
  id: string; // for store keying
  shaderId: string; // for shader logic
  isActive: boolean;
  name: string;
  vertexShader: string;
  fragmentShader: string;
  ranges: any; // Replace with actual type if known
}

// Updated ShaderCacheStore to handle multiple textures
export interface ShaderCacheStore {
  shaders: { [key: string]: ShaderSettings };
  textures: { [key: string]: THREE.Texture };
  addShader: (shader: ShaderSettings) => void;
  removeShader: (shaderId: string) => void;
  setTexture: (shaderId: string, tex: THREE.Texture) => void;
}

export const useShaderCacheStore = create<ShaderCacheStore>(set => ({
  shaders: {},
  textures: {},
  addShader: (shader: ShaderSettings) => {
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