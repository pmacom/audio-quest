export enum ColorSwatch {
  blue = 'blue',
  white = 'white',
  silver = 'silver',
  red = 'red',
  green = 'green',
  yellow = 'yellow',
  orange = 'orange',
  purple = 'purple',
}

export enum DisplayType {
  Normal,
  Bipolar,
  Boolean,
  ChromaVector,
  Default,
}

export interface DisplayRowProps {
  label: string;
  value: number;
  labelColor: ColorSwatch;
  displayType: DisplayType;
}

export interface DisplayBipolarProps {
  label: string;
  value: number;
  color: ColorSwatch;
  className?: string;
}

export interface DisplayChromaVectorProps {
  label: string;
  value: number; // Required for DisplayRowProps compatibility
  chromaVector: Float32Array;
  color: ColorSwatch;
} 


export type TweakRange = {
  min: number,
  max: number,
  value: number,
  source: string | null,
  manualValue?: number
}

export type GroupOfTen<T> = [T, T, T, T, T, T, T, T, T, T]
export type TweakRanges = GroupOfTen<TweakRange>
export type ShaderSettings = {
  id: string,
  name: string,
  vertexShader: string,
  fragmentShader: string,
  isActive: boolean,
  ranges: TweakRanges
}