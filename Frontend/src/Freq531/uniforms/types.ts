import { Freq530FieldKeys } from "../stores/useFreq530"

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

const NORMAL_SETTINGS = { min: 0, max: 1 }
const BIPOLAR_SETTINGS = { min: -1, max: 1 }

// export const UniformStateTypeSettings = {
//   [Freq530StateKeys.time]: null,
//   [Freq530StateKeys.adjustedTime]: null,
//   [Freq530StateKeys.sin]: BIPOLAR_SETTINGS,
//   [Freq530StateKeys.cos]: BIPOLAR_SETTINGS,
//   [Freq530StateKeys.sinNormal]: NORMAL_SETTINGS,
//   [Freq530StateKeys.cosNormal]: NORMAL_SETTINGS,
//   [Freq530StateKeys.adjustedSin]: BIPOLAR_SETTINGS,
//   [Freq530StateKeys.adjustedCos]: BIPOLAR_SETTINGS,
//   [Freq530StateKeys.adjustedSinNormal]: NORMAL_SETTINGS,
//   [Freq530StateKeys.adjustedCosNormal]: NORMAL_SETTINGS,
//   [Freq530StateKeys.low]: NORMAL_SETTINGS,
//   [Freq530StateKeys.mid]: NORMAL_SETTINGS,
//   [Freq530StateKeys.high]: NORMAL_SETTINGS,
//   [Freq530StateKeys.kick]: NORMAL_SETTINGS,
//   [Freq530StateKeys.snare]: NORMAL_SETTINGS,
//   [Freq530StateKeys.hihat]: NORMAL_SETTINGS,
//   [Freq530StateKeys.vocalLikelihood]: NORMAL_SETTINGS,
//   [Freq530StateKeys.amplitude]: null,
//   [Freq530StateKeys.rawAmplitude]: null,
//   [Freq530StateKeys.beatIntensity]: null,
//   [Freq530StateKeys.bps]: null,



//   [Freq530StateKeys.lowDynamic]: null,
//   [Freq530StateKeys.midDynamic]: null,
//   [Freq530StateKeys.highDynamic]: null,
//   [Freq530StateKeys.kickDynamic]: null,
//   [Freq530StateKeys.snareDynamic]: null,
//   [Freq530StateKeys.hihatDynamic]: null,
//   [Freq530StateKeys.amplitudeDynamic]: null,
//   [Freq530StateKeys.rawAmplitudeDynamic]: null,
// }