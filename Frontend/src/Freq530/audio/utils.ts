import { CONSTANTS } from "../constants";
import {
  CircularBuffer,
  FrequencyRanges,
  GainState,
  HistoryState,
  BeatDetectionState,
  AudioProcessingResult,
} from "./types";

// Core Audio Processing
const normalizeDecibelValue = (dbValue: number, minDb: number = -120, maxDb: number = 0): number => {
  const clampedDb = Math.max(Math.min(dbValue, maxDb), minDb);
  return (clampedDb - minDb) / (maxDb - minDb);
};

const dbToMagnitude = (db: number): number => {
  if (db <= -100) return 0;
  return Math.min(1, Math.pow(10, (db + 60) / 20));
};

const dbArrayToMagnitudes = (dbArray: Float32Array | number[]): Float32Array => {
  const result = new Float32Array(dbArray.length);
  for (let i = 0; i < dbArray.length; i++) {
    result[i] = dbToMagnitude(dbArray[i]);
  }
  return result;
};

// History and Normalization
const createHistoryState = (size: number): HistoryState => ({
  buffer: new CircularBuffer(size),
  min: Infinity,
  max: -Infinity
});

const updateMinMax = (history: HistoryState, newValue: number): void => {
  const oldValue = history.buffer.values[0];
  
  if (newValue > history.max) history.max = newValue;
  if (newValue < history.min) history.min = newValue;
  
  if (oldValue === history.min || oldValue === history.max) {
    const values = history.buffer.values;
    history.min = Math.min(...values, newValue);
    history.max = Math.max(...values, newValue);
  }
};

const normalize = (value: number, history: HistoryState): number => {
  if (history.max === history.min) return value;
  return (value - history.min) / (history.max - history.min);
};

// Amplitude Processing
const calculateAmplitudeRMS = (data: Float32Array | number[]): number => {
  const linearValues = dbArrayToMagnitudes(data);
  let sum = 0;
  for (let i = 0; i < linearValues.length; i++) {
    sum += linearValues[i] * linearValues[i];
  }
  const rms = Math.sqrt(sum / linearValues.length);
  return Math.min(1, rms * 4);
};

const applyEnvelope = (current: number, previous: number): number => {
  if (current >= previous) return current;
  return Math.max(
    previous * CONSTANTS.DECAY_RATE + current * (1 - CONSTANTS.DECAY_RATE),
    0
  );
};

const applyGainAndHistory = (
  value: number,
  gain: number,
  history: HistoryState
): GainState => {
  const gainedValue = value * gain;
  history.buffer.push(gainedValue);
  updateMinMax(history, gainedValue);
  const normalizedValue = normalize(gainedValue, history);
  
  let newGain = gain;
  if (normalizedValue < CONSTANTS.TARGET_RANGES.MIN) {
    newGain += CONSTANTS.GAIN_ADJUST_RATE;
  } else if (normalizedValue > CONSTANTS.TARGET_RANGES.MAX) {
    newGain -= CONSTANTS.GAIN_ADJUST_RATE;
  }
  
  return {
    value: normalizedValue,
    gain: Math.min(Math.max(newGain, 0.1), 10)
  };
};

// Frequency Analysis
const calculateBandMagnitude = (
  fftBins: Float32Array,
  startIndex: number,
  endIndex: number
): number => {
  let sum = 0;
  for (let i = startIndex; i < endIndex && i < fftBins.length; i++) {
    sum += dbToMagnitude(fftBins[i]);
  }
  return sum / (endIndex - startIndex);
};

const useFrequencyRanges = (fftBins: Float32Array, fftSize: number): FrequencyRanges => {
  const lowEndIndex = Math.floor(fftSize * 250 / 44100);
  const midEndIndex = Math.floor(fftSize * 4000 / 44100);
  
  return {
    low: calculateBandMagnitude(fftBins, 0, lowEndIndex),
    mid: calculateBandMagnitude(fftBins, lowEndIndex, midEndIndex),
    high: calculateBandMagnitude(fftBins, midEndIndex, fftBins.length)
  };
};

// Beat Detection
const calculateBeatBandEnergy = (
  data: Float32Array,
  minFreq: number,
  maxFreq: number,
  sampleRate: number
): number => {
  const binWidth = sampleRate / (2 * data.length);
  const minBin = Math.floor(minFreq / binWidth);
  const maxBin = Math.ceil(maxFreq / binWidth);
  
  let energy = 0;
  let peakEnergy = -Infinity;
  let binCount = 0;
  
  for (let i = minBin; i < maxBin && i < data.length; i++) {
    const db = Math.max(-70, Math.min(0, data[i]));
    const magnitude = Math.pow(10, db / 10);
    energy += magnitude;
    peakEnergy = Math.max(peakEnergy, magnitude);
    binCount++;
  }
  
  if (binCount === 0) return 0;
  
  const avgEnergy = energy / binCount;
  const combinedEnergy = (peakEnergy * 0.7 + avgEnergy * 0.3);
  return Math.min(1, Math.pow(combinedEnergy * 3, 0.8));
};

const calculateBeatRMS = (data: Float32Array | number[]): number => {
  const sum = Array.from(data).reduce((acc, val) => acc + val * val, 0);
  return Math.sqrt(sum / data.length);
};

const calculateSpectralFlux = (
  currentBins: Float32Array | number[],
  prevBins: Float32Array | number[] | null
): number => {
  if (!prevBins) return 0;
  
  const minLength = Math.min(currentBins.length, prevBins.length);
  let flux = 0;
  
  for (let i = 0; i < minLength; i++) {
    const curr = Math.max(0, currentBins[i]);
    const prev = Math.max(0, prevBins[i]);
    flux += Math.max(0, curr - prev);
  }
  
  return flux / minLength;
};

const updateBeatDetection = (
  kickState: GainState,
  snareState: GainState,
  hihatState: GainState,
  prevKickAvg: number,
  prevSnareAvg: number,
  prevHihatAvg: number,
  spectralFlux: number,
  isAudioActive: boolean,
  lastBeatTime: number,
  now: number
): BeatDetectionState => {
  const kickAverage = prevKickAvg * CONSTANTS.BEAT_DETECTION_PARAMETERS.BEAT_ALPHA + 
                     kickState.value * (1 - CONSTANTS.BEAT_DETECTION_PARAMETERS.BEAT_ALPHA);
  const snareAverage = prevSnareAvg * CONSTANTS.BEAT_DETECTION_PARAMETERS.BEAT_ALPHA + 
                      snareState.value * (1 - CONSTANTS.BEAT_DETECTION_PARAMETERS.BEAT_ALPHA);
  const hihatAverage = prevHihatAvg * CONSTANTS.BEAT_DETECTION_PARAMETERS.BEAT_ALPHA + 
                      hihatState.value * (1 - CONSTANTS.BEAT_DETECTION_PARAMETERS.BEAT_ALPHA);

  const kickRatio = kickState.value / Math.max(0.00001, kickAverage);
  const snareRatio = snareState.value / Math.max(0.00001, snareAverage);
  const hihatRatio = hihatState.value / Math.max(0.00001, hihatAverage);

  const combinedRatio = (kickRatio * 0.6 + snareRatio * 0.3 + hihatRatio * 0.1);
  const timeSinceLastBeat = now - lastBeatTime;
  
  const isBeatCandidate = 
    isAudioActive &&
    combinedRatio > CONSTANTS.BEAT_DETECTION_PARAMETERS.BEAT_THRESHOLD &&
    spectralFlux > CONSTANTS.BEAT_DETECTION_PARAMETERS.SPECTRAL_FLUX_THRESHOLD &&
    timeSinceLastBeat > CONSTANTS.BEAT_DETECTION_PARAMETERS.MIN_BEAT_INTERVAL;

  return {
    kickAverage,
    snareAverage,
    hihatAverage,
    isBeatCandidate,
    combinedRatio,
    timeSinceLastBeat
  };
};

const updateBeatIntensity = (
  prevBeatIntensity: number,
  isBeatCandidate: boolean,
  combinedRatio: number,
  timeSinceLastBeat: number
): number => {
  if (isBeatCandidate) {
    return Math.min(
      1.0,
      Math.max(0, prevBeatIntensity * (1 - CONSTANTS.BEAT_DETECTION_PARAMETERS.BEAT_DECAY_RATE * timeSinceLastBeat) + 
      combinedRatio * 0.2)
    );
  }
  return Math.max(
    0,
    prevBeatIntensity * (1 - CONSTANTS.BEAT_DETECTION_PARAMETERS.BEAT_DECAY_RATE * 0.5 * timeSinceLastBeat)
  );
};

const updateBeatTimes = (
  currentBeatTimes: number[],
  now: number,
  isBeatCandidate: boolean
): number[] => {
  if (!isBeatCandidate) return currentBeatTimes;
  return [...currentBeatTimes, now].filter(
    time => now - time < CONSTANTS.HISTORY_WINDOW_SIZE.BEAT_TIME_WINDOW
  );
};

const calculateInstantBPS = (beatTimes: number[]): number => {
  if (beatTimes.length < 2) return 0;
  
  const intervals = [];
  for (let i = 1; i < beatTimes.length; i++) {
    intervals.push(beatTimes[i] - beatTimes[i - 1]);
  }
  
  const validIntervals = intervals.filter(interval => interval > 0.1);
  if (validIntervals.length === 0) return 0;
  
  const avgInterval = validIntervals.reduce((sum, val) => sum + val, 0) / validIntervals.length;
  return avgInterval > 0 ? 1 / avgInterval : 0;
};

const updateBPS = (currentBPS: number, beatTimes: number[]): number => {
  const instantBPS = calculateInstantBPS(beatTimes);
  return currentBPS * (1 - CONSTANTS.BEAT_DETECTION_PARAMETERS.BPS_SMOOTHING_FACTOR) + 
         instantBPS * CONSTANTS.BEAT_DETECTION_PARAMETERS.BPS_SMOOTHING_FACTOR;
};

// Vocal Detection
const getHarmonicScore = (fftBins: Float32Array): number => {
  const binWidth = CONSTANTS.SAMPLE_RATE / (2 * CONSTANTS.FREQUENCY_DATA_BUFFER_SIZE);
  const minBin = Math.floor(CONSTANTS.VOCAL_FREQ_MIN / binWidth);
  const maxBin = Math.ceil(CONSTANTS.VOCAL_FREQ_MAX / binWidth);
  const maxAmplitude = Math.max(...fftBins.slice(minBin, maxBin));
  const normalizedFft = fftBins.map(v => maxAmplitude > 0 ? v / maxAmplitude : 0);
  
  let harmonicCount = 0;
  for (let fundamentalBin = minBin; fundamentalBin < maxBin / 2; fundamentalBin++) {
    const fundamentalFreq = fundamentalBin * binWidth;
    if (normalizedFft[fundamentalBin] > CONSTANTS.HARMONIC_THRESHOLD) {
      let harmonicsFound = 0;
      for (let harmonic = 2; harmonic <= CONSTANTS.HARMONIC_COUNT + 1; harmonic += 2) {
        const harmonicBin = Math.round((fundamentalFreq * harmonic) / binWidth);
        if (harmonicBin < maxBin && normalizedFft[harmonicBin] > CONSTANTS.HARMONIC_THRESHOLD) {
          harmonicsFound++;
        }
      }
      if (harmonicsFound >= Math.floor(CONSTANTS.HARMONIC_COUNT / 2)) harmonicCount++;
    }
  }
  return harmonicCount > 0 ? Math.min(harmonicCount / 5, 1) : 0;
};

const calculateMidVariance = (currentMid: number, history: HistoryState): number => {
  const values = history.buffer.values.slice(-CONSTANTS.HISTORY_WINDOW_SIZE.VOCAL_VARIANCE_WINDOW);
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  
  return Math.min(variance / CONSTANTS.VOCAL_MAX_VARIANCE, 1);
};

// Audio Processing Pipeline
const processAudioData = (
  frequencyData: Float32Array,
  prevFftBins: Float32Array | null
): AudioProcessingResult => {
  const linearMagnitudes = dbArrayToMagnitudes(frequencyData);
  
  const beatRMS = calculateBeatRMS(linearMagnitudes);
  const isAudioActive = beatRMS > CONSTANTS.AUDIO_ACTIVITY_THRESHOLD;
  const spectralFlux = calculateSpectralFlux(linearMagnitudes, prevFftBins);

  return {
    linearMagnitudes,
    isAudioActive,
    spectralFlux
  };
};

export const UTILS_AUDIO = {
  // Core Audio Processing
  normalizeDecibelValue,
  dbToMagnitude,
  dbArrayToMagnitudes,

  // History and Normalization
  createHistoryState,
  updateMinMax,
  normalize,

  // Amplitude Processing
  calculateAmplitudeRMS,
  applyEnvelope,
  applyGainAndHistory,

  // Frequency Analysis
  useFrequencyRanges,
  calculateBandMagnitude,

  // Beat Detection
  calculateBeatBandEnergy,
  calculateBeatRMS,
  calculateSpectralFlux,
  updateBeatDetection,
  updateBeatIntensity,
  updateBeatTimes,
  calculateInstantBPS,
  updateBPS,

  // Vocal Detection
  getHarmonicScore,
  calculateMidVariance,

  // Audio Processing Pipeline
  processAudioData
};