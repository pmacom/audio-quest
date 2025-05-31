// import { ShaderDataTypes, ShaderUniformShape } from "./types";

// export const ShaderDefaultSettings: ShaderUniformShape = {
//   time: {
//     description: 'Time since the start of the shader',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uTime',
//     storeDataName: 'time'
//   },
//   adjustedAccumulatedTime: {
//     description: 'Time that has been impacted by the amplitude of the audio. Time speeds up as the amplitude increases, and slows down when the amplitude decreases. This is the overall time value based on all of these previous events and where time should be according to them.',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uAdjustedAccumulatedTime',
//     storeDataName: 'adjustedAccumulatedTime'
//   },
//   sinValue: {
//     description: 'Sin Value of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uSinValue',
//     storeDataName: 'sinValue'
//   },
//   cosValue: {
//     description: 'Cos Value of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uCosValue',
//     storeDataName: 'cosValue'
//   },
//   mirrorValue: {
//     description: 'Mirror Value of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uMirrorValue',
//     storeDataName: 'mirrorValue'
//   },
//   mirrorDirection: {
//     description: 'Mirror Direction of the audio based on the accumulated time, which is either 1 or -1',
//     default: 1,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uMirrorDirection',
//     storeDataName: 'mirrorDirection'
//   },
//   easedMirrorValue: {
//     description: 'Eased Mirror Value of the audio based on the accumulated time, that has been eased in and out according to the mirror direction',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uEasedMirrorValue',
//     storeDataName: 'easedMirrorValue'
//   },
//   easedMirrorDirection: {
//     description: 'Eased Mirror Direction of the audio based on the accumulated time, which is either 1 or -1',
//     default: 1,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uEasedMirrorDirection',
//     storeDataName: 'easedMirrorDirection'
//   },
//   easedMirrorRangeValue: {
//     description: 'Eased Mirror Range Value of the audio based on the accumulated time, which is the value that is used to determine the range of the mirror, it fluctuates between the min and max values',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uEasedMirrorRangeValue',
//     storeDataName: 'easedMirrorRangeValue'
//   },
//   easedMirrorRangeMin: {
//     description: 'Eased Mirror Range Min of the audio based on the accumulated time, which is the minimum value that the mirror can reach',
//     default: -0.5,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uEasedMirrorRangeMin',
//     storeDataName: 'easedMirrorRangeMin'
//   },
//   easedMirrorRangeMax: {
//     description: 'Eased Mirror Range Max of the audio based on the accumulated time, which is the maximum value that the mirror can reach',
//     default: 0.5,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uEasedMirrorRangeMax',
//     storeDataName: 'easedMirrorRangeMax'
//   },
//   easedMirrorRangeDirection: {
//     description: 'Eased Mirror Range Direction of the audio based on the accumulated time, which is either 1 or -1',
//     default: 1,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uEasedMirrorRangeDirection',
//     storeDataName: 'easedMirrorRangeDirection'
//   },
//   low: {
//     description: 'Low Frequency of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uLow',
//     storeDataName: 'low'
//   },
//   mid: {
//     description: 'Mid Frequency of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uMid',
//     storeDataName: 'mid'
//   },
//   high: {
//     description: 'High Frequency of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uHigh',
//     storeDataName: 'high'
//   },
//   kick: {
//     description: 'Kick Frequency of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uKick',
//     storeDataName: 'kick'
//   },
//   snare: {
//     description: 'Snare Frequency of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uSnare',
//     storeDataName: 'snare'
//   },
//   hihat: {
//     description: 'Hihat Frequency of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uHihat',
//     storeDataName: 'hihat'
//   },
//   vocalLikelihood: {
//     description: 'Vocal Likelihood of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uVocalLikelihood',
//     storeDataName: 'vocalLikelihood'
//   },
//   amplitude: {
//     description: 'Amplitude of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uAmplitude',
//     storeDataName: 'amplitude'
//   },
//   rawAmplitude: {
//     description: 'Raw Amplitude of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uRawAmplitude',
//     storeDataName: 'rawAmplitude'
//   },
//   beatIntensity: {
//     description: 'Beat Intensity of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uBeatIntensity',
//     storeDataName: 'beatIntensity'
//   },
//   bps: {
//     description: 'Beats Per Second of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uBps',
//     storeDataName: 'bps'
//   },
//   snareAverage: {
//     description: 'Snare Average of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uSnareAverage',
//     storeDataName: 'snareAverage'
//   },
//   hihatAverage:  {
//     description: 'Hihat Average of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uHihatAverage',
//     storeDataName: 'hihatAverage'
//   },
//   kickAverage:  {
//     description: 'Kick Average of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uKickAverage',
//     storeDataName: 'kickAverage'
//   },
//   sinNormalValue: {
//     description: 'Sin Normal Value of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uSinNormalValue',
//     storeDataName: 'sinNormalValue'
//   },
//   cosNormalValue: {
//     description: 'Cos Normal Value of the audio based on the accumulated time',
//     default: 0,
//     shaderDataType: ShaderDataTypes.FLOAT,
//     shaderUniformName: 'uCosNormalValue',
//     storeDataName: 'cosNormalValue'
//   }
// }