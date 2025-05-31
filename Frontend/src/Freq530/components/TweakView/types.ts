// Types for TweakView system

export interface TweakRange {
  min: number;
  max: number;
  lerp: number;
}

export type TweakRanges = TweakRange[];

export interface ShaderSettings {
  name: string;
  vertexShader: string;
  fragmentShader: string;
  ranges: TweakRanges;
}

// Add any other types/interfaces as needed for TweakView 