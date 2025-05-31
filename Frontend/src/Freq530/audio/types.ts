export class CircularBuffer {
  private _values: number[];
  private _pointer: number;
  private _size: number;

  constructor(size: number) {
    this._values = new Array(size).fill(0);
    this._pointer = 0;
    this._size = size;
  }

  push(value: number) {
    this._values[this._pointer] = value;
    this._pointer = (this._pointer + 1) % this._size;
  }

  get values(): number[] {
    return [...this._values.slice(this._pointer), ...this._values.slice(0, this._pointer)];
  }
}

export interface HistoryState {
  buffer: CircularBuffer;
  min: number;
  max: number;
}

export interface FrequencyRanges {
  low: number;
  mid: number;
  high: number;
}

export interface GainState {
  value: number;
  gain: number;
}

export interface BeatDetectionState {
  kickAverage: number;
  snareAverage: number;
  hihatAverage: number;
  isBeatCandidate: boolean;
  combinedRatio: number;
  timeSinceLastBeat: number;
}

export interface AudioProcessingResult {
  linearMagnitudes: Float32Array;
  isAudioActive: boolean;
  spectralFlux: number;
}

export interface VocalDetectionResult {
  harmonicScore: number;
  midVariance: number;
  vocalLikelihood: number;
}

export interface FrequencyBandResult {
  low: GainState;
  mid: GainState;
  high: GainState;
}

export interface BeatAnalysisResult {
  kick: GainState;
  snare: GainState;
  hihat: GainState;
  beatIntensity: number;
  bps: number;
  beatTimes: number[];
}

export interface AmplitudeAnalysisResult {
  raw: GainState;
  smoothed: GainState;
}

export interface SpectralFeatures {
  centroid: number;
  spread: number;
  skewness: number;
  kurtosis: number;
}

export interface ChromaFeatures {
  chromaVector: Float32Array; // 12 elements representing pitch classes (C through B)
  dominantNote: number; // Index of the strongest pitch class
  noteProbabilities: Float32Array; // Normalized probabilities for each pitch class
}

export interface OnsetDetectionResult {
  isOnset: boolean;
  strength: number;
  type: 'percussive' | 'harmonic' | 'broadband';
}

export interface TempoAnalysis {
  bpm: number;
  confidence: number;
  stability: number;
  phase: number;
}