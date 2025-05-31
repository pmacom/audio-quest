import { ColorSwatch, DisplayType } from "./types";
import { AudioProcessor } from "@/Freq530/audio/AudioProcessor";

// All possible keys (including enhanced)
export type AudioDisplayKey =
  | 'time'
  | 'adjustedTime'
  | 'sin'
  | 'cos'
  | 'adjustedSin'
  | 'adjustedCos'
  | 'sinNormal'
  | 'cosNormal'
  | 'adjustedSinNormal'
  | 'adjustedCosNormal'
  | 'low'
  | 'mid'
  | 'high'
  | 'vocalLikelihood'
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'amplitude'
  | 'rawAmplitude'
  | 'beatIntensity'
  | 'bps'
  | 'bpm'
  | 'spectralCentroid'
  | 'tempoStability'
  | 'beatPhase'
  | 'isOnset'
  | 'chromaVector';

export interface AudioDisplayConfig {
  label: string;
  color: ColorSwatch;
  displayType: DisplayType;
  enhancedFlag?: keyof ReturnType<typeof AudioProcessor.getEnhancedAnalysisFlags>;
}

export const AUDIO_DISPLAY_CONFIG: Record<AudioDisplayKey, AudioDisplayConfig> = {
  time: { label: 'Time', color: ColorSwatch.orange, displayType: DisplayType.Default },
  adjustedTime: { label: 'AdjustedTime', color: ColorSwatch.white, displayType: DisplayType.Default },
  sin: { label: 'Sin', color: ColorSwatch.orange, displayType: DisplayType.Bipolar },
  cos: { label: 'Cos', color: ColorSwatch.purple, displayType: DisplayType.Bipolar },
  adjustedSin: { label: 'AdjustedSin', color: ColorSwatch.white, displayType: DisplayType.Bipolar },
  adjustedCos: { label: 'AdjustedCos', color: ColorSwatch.white, displayType: DisplayType.Bipolar },
  sinNormal: { label: 'SinNormal', color: ColorSwatch.white, displayType: DisplayType.Bipolar },
  cosNormal: { label: 'CosNormal', color: ColorSwatch.white, displayType: DisplayType.Bipolar },
  adjustedSinNormal: { label: 'AdjustedSinNormal', color: ColorSwatch.white, displayType: DisplayType.Bipolar },
  adjustedCosNormal: { label: 'AdjustedCosNormal', color: ColorSwatch.white, displayType: DisplayType.Bipolar },
  low: { label: 'Low', color: ColorSwatch.red, displayType: DisplayType.Bipolar },
  mid: { label: 'Mid', color: ColorSwatch.green, displayType: DisplayType.Bipolar },
  high: { label: 'High', color: ColorSwatch.blue, displayType: DisplayType.Bipolar },
  vocalLikelihood: { label: 'Vocal Likelihood', color: ColorSwatch.white, displayType: DisplayType.Bipolar },
  kick: { label: 'Kick', color: ColorSwatch.red, displayType: DisplayType.Bipolar },
  snare: { label: 'Snare', color: ColorSwatch.green, displayType: DisplayType.Bipolar },
  hihat: { label: 'HiHat', color: ColorSwatch.blue, displayType: DisplayType.Bipolar },
  beatIntensity: { label: 'Beat Intensity', color: ColorSwatch.yellow, displayType: DisplayType.Bipolar },
  rawAmplitude: { label: 'Raw Amplitude', color: ColorSwatch.silver, displayType: DisplayType.Bipolar },
  amplitude: { label: 'Amplitude', color: ColorSwatch.white, displayType: DisplayType.Default },
  bps: { label: 'BPS', color: ColorSwatch.orange, displayType: DisplayType.Default },
  bpm: { label: 'BPM', color: ColorSwatch.orange, displayType: DisplayType.Bipolar, enhancedFlag: 'tempo' },
  spectralCentroid: { label: 'Spectral Centroid', color: ColorSwatch.white, displayType: DisplayType.Normal, enhancedFlag: 'spectral' },
  tempoStability: { label: 'Tempo Stability', color: ColorSwatch.silver, displayType: DisplayType.Bipolar, enhancedFlag: 'tempo' },
  beatPhase: { label: 'Beat Phase', color: ColorSwatch.purple, displayType: DisplayType.Bipolar, enhancedFlag: 'tempo' },
  isOnset: { label: 'Is Onset', color: ColorSwatch.white, displayType: DisplayType.Boolean, enhancedFlag: 'onset' },
  chromaVector: { label: 'Chroma Vector', color: ColorSwatch.yellow, displayType: DisplayType.ChromaVector, enhancedFlag: 'chroma' },
};

export function getDisplayConfig(key: AudioDisplayKey): AudioDisplayConfig | null {
  const config = AUDIO_DISPLAY_CONFIG[key];
  if (!config) return null;
  if (config.enhancedFlag) {
    const flags = AudioProcessor.getEnhancedAnalysisFlags();
    if (!flags[config.enhancedFlag]) return null;
  }
  return config;
}

export const BASE_AUDIO_KEYS: AudioDisplayKey[] = [
  'time',
  'adjustedTime',
  'sin',
  'cos',
  'adjustedSin',
  'adjustedCos',
  'sinNormal',
  'cosNormal',
  'adjustedSinNormal',
  'adjustedCosNormal',
  'low',
  'mid',
  'high',
  'vocalLikelihood',
  'kick',
  'snare',
  'hihat',
  'rawAmplitude',
  'beatIntensity',
  'amplitude',
  'bps',
];

export const ENHANCED_AUDIO_KEYS: AudioDisplayKey[] = [
  'spectralCentroid',
  'tempoStability',
  'beatPhase',
  'bpm',
  'isOnset',
  'chromaVector',
]; 