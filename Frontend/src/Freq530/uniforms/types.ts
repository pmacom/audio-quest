import { Freq530StateKeys } from "../stores/useFreq530"

export enum ShaderDataTypes {
  FLOAT,
  BOOLEAN,
}

export enum AudioValueTypes {
  FLOAT,
  NORMAL,
  BIPOLAR,
  BOOLEAN,
}

export type ShaderUniformShape = {
  [key:string]: {
    description?: string,
    default: any,
    shaderDataType: ShaderDataTypes,
    shaderUniformName: string,
    storeDataName: string,
  }
}

export interface UniformStateNames {
  [Freq530StateKeys.time]: "time",
  [Freq530StateKeys.adjustedTime]: "adjustedTime",
  [Freq530StateKeys.sin]: "sin",
  [Freq530StateKeys.cos]: "cos",
  [Freq530StateKeys.sinNormal]: "sinNormal",
  [Freq530StateKeys.cosNormal]: "cosNormal",
  [Freq530StateKeys.adjustedSin]: "adjustedSin",
  [Freq530StateKeys.adjustedCos]: "adjustedCos",
  [Freq530StateKeys.adjustedSinNormal]: "adjustedSinNormal",
  [Freq530StateKeys.adjustedCosNormal]: "adjustedCosNormal",
  [Freq530StateKeys.low]: "low",
  [Freq530StateKeys.mid]: number;
  [Freq530StateKeys.high]: "high",
  [Freq530StateKeys.kick]: "kick",
  [Freq530StateKeys.snare]: "snare",
  [Freq530StateKeys.hihat]: "hihat",
  [Freq530StateKeys.vocalLikelihood]: "vocalLikelihood",
  [Freq530StateKeys.amplitude]: "amplitude",
  [Freq530StateKeys.rawAmplitude]: "rawAmplitude",
  [Freq530StateKeys.beatIntensity]: "beatIntensity",
  [Freq530StateKeys.bps]: "bps",
}

const NORMAL_SETTINGS = { min: 0, max: 1 }
const BIPOLAR_SETTINGS = { min: -1, max: 1 }

export const UniformStateTypeSettings = {
  [Freq530StateKeys.time]: null,
  [Freq530StateKeys.adjustedTime]: null,
  [Freq530StateKeys.sin]: BIPOLAR_SETTINGS,
  [Freq530StateKeys.cos]: BIPOLAR_SETTINGS,
  [Freq530StateKeys.sinNormal]: NORMAL_SETTINGS,
  [Freq530StateKeys.cosNormal]: NORMAL_SETTINGS,
  [Freq530StateKeys.adjustedSin]: BIPOLAR_SETTINGS,
  [Freq530StateKeys.adjustedCos]: BIPOLAR_SETTINGS,
  [Freq530StateKeys.adjustedSinNormal]: NORMAL_SETTINGS,
  [Freq530StateKeys.adjustedCosNormal]: NORMAL_SETTINGS,
  [Freq530StateKeys.low]: NORMAL_SETTINGS,
  [Freq530StateKeys.mid]: NORMAL_SETTINGS,
  [Freq530StateKeys.high]: NORMAL_SETTINGS,
  [Freq530StateKeys.kick]: NORMAL_SETTINGS,
  [Freq530StateKeys.snare]: NORMAL_SETTINGS,
  [Freq530StateKeys.hihat]: NORMAL_SETTINGS,
  [Freq530StateKeys.vocalLikelihood]: NORMAL_SETTINGS,
  [Freq530StateKeys.amplitude]: null,
  [Freq530StateKeys.rawAmplitude]: null,
  [Freq530StateKeys.beatIntensity]: null,
  [Freq530StateKeys.bps]: null,
}