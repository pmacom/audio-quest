export const CONSTANTS = {
  DEFAULT_CACHE_SIZE: 500,
}

export const Freq530FieldKeys = [
  'time', 'adjustedTime',
  'sin', 'cos', 'sinNormal', 'cosNormal',
  'adjustedSin', 'adjustedCos', 'adjustedSinNormal', 'adjustedCosNormal',
  'low', 'mid', 'high', 'kick', 'snare', 'hihat',
  'vocalLikelihood', 'amplitude', 'rawAmplitude',
  'beatIntensity', 'bps',
  'lowDynamic', 'midDynamic', 'highDynamic',
  'kickDynamic', 'snareDynamic', 'hihatDynamic',
  'amplitudeDynamic', 'rawAmplitudeDynamic',
  'spectralFlux', 'beatTimes', 'lastBeatTime', 'quantizedBands',
  'spectogram',
] as const