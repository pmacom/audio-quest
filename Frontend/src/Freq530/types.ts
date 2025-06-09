import { Freq530FieldKeys } from "./constants"

export interface ShaderSettings {
  shaderId: string
  isActive: boolean
  name: string
  vertexShader: string
  fragmentShader: string
  ranges: TweakRanges // Replace with actual type if known
}

export type TweakRange = {
  min: number,
  max: number,
  value: number,
  source: typeof Freq530FieldKeys[number] | null,
  manualValue?: number
}

export type GroupOfTen<T> = [T, T, T, T, T, T, T, T, T, T]
export type TweakRanges = GroupOfTen<TweakRange>

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

export const enum Freq530FieldType {
  Neg1To1 = 'neg1to1',
  Zero1 = 'zero1',
  Number = 'number',
  NumberArray = 'numberArray',
  NumberArrayBars = 'numberArrayBars',
  Debug = 'debug',
  Spectogram = 'spectogram',
}

export const Freq530InputRanges: Record<Freq530FieldType, { min: number, max: number }> = {
  [Freq530FieldType.Neg1To1]: { min: -1, max: 1 },
  [Freq530FieldType.Zero1]: { min: 0, max: 1 },
  [Freq530FieldType.Number]: { min: 0, max: 100 }, // Customize as needed
  [Freq530FieldType.NumberArray]: { min: 0, max: 1 },
  [Freq530FieldType.NumberArrayBars]: { min: 0, max: 1 },
  [Freq530FieldType.Debug]: { min: 0, max: 1 },
  [Freq530FieldType.Spectogram]: { min: 0, max: 1 },
};