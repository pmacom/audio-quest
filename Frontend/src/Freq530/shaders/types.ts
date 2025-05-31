import { RefObject } from "react"

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
  id: number,
  name: string,
  vertexShader: string,
  fragmentShader: string,
  ranges: TweakRanges
}

// export type DebugTweakSettings = {
//   debug_showSingle: boolean,
//   debug_showSingleIndex: number,
//   ranges: TweakRanges
// }

// export type TweakSettings = {
//   showSingle: boolean,
//   showSingleIndex: number,
//   ranges: RefObject<TweakRanges> | null
// }
