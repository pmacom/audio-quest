import { CONSTANTS } from "../constants";
import { HistoryState } from "./types";
import { UTILS_AUDIO } from "./utils";
import { EnhancedAudioAnalysis, EnhancedAudioFeatureFlags } from "./enhanced-analysis";

// Extend the Freq530State interface with new features
interface Freq530State {
  time: number;
  adjustedTime: number;
  sin: number;
  cos: number;
  sinNormal: number;
  cosNormal: number;
  adjustedSin: number;
  adjustedCos: number;
  adjustedSinNormal: number;
  adjustedCosNormal: number;
  low: number;
  mid: number;
  high: number;
  kick: number;
  snare: number;
  hihat: number;
  vocalLikelihood: number;
  amplitude: number;
  rawAmplitude: number;
  beatIntensity: number;
  bps: number;
  isInitialized: boolean;
  isAudioActive: boolean;
  kickGain: number;
  snareGain: number;
  hihatGain: number;
  vocalGain: number;
  amplitudeGain: number;
  rawAmplitudeGain: number;
  lowGain: number;
  midGain: number;
  highGain: number;
  kickAverage: number;

  // Essential enhanced features for visualization
  spectralCentroid: number;     // Brightness of sound
  chromaVector: Float32Array;   // Musical pitch content
  dominantNote: number;         // Current strongest musical note
  isOnset: boolean;            // Beat/note detection
  bpm: number;                 // Tempo
  tempoStability: number;      // How steady the tempo is
  beatPhase: number;          // Position within beat cycle
}

export class AudioProcessor {
  private static instance: AudioProcessor;
  private enhancedAnalysis: EnhancedAudioAnalysis;

  // Audio processing states
  private frequencyData: Float32Array = new Float32Array(0);
  private lowHistory: HistoryState = UTILS_AUDIO.createHistoryState(CONSTANTS.HISTORY_WINDOW_SIZE.FREQ_HISTORY_WINDOW);
  private midHistory: HistoryState = UTILS_AUDIO.createHistoryState(CONSTANTS.HISTORY_WINDOW_SIZE.FREQ_HISTORY_WINDOW);
  private highHistory: HistoryState = UTILS_AUDIO.createHistoryState(CONSTANTS.HISTORY_WINDOW_SIZE.FREQ_HISTORY_WINDOW);
  private kickHistory: HistoryState = UTILS_AUDIO.createHistoryState(CONSTANTS.HISTORY_WINDOW_SIZE.BEAT_HISTORY_WINDOW);
  private snareHistory: HistoryState = UTILS_AUDIO.createHistoryState(CONSTANTS.HISTORY_WINDOW_SIZE.BEAT_HISTORY_WINDOW);
  private hihatHistory: HistoryState = UTILS_AUDIO.createHistoryState(CONSTANTS.HISTORY_WINDOW_SIZE.BEAT_HISTORY_WINDOW);
  private vocalHistory: HistoryState = UTILS_AUDIO.createHistoryState(CONSTANTS.HISTORY_WINDOW_SIZE.VOCAL_HISTORY_WINDOW);
  private amplitudeHistory: HistoryState = UTILS_AUDIO.createHistoryState(CONSTANTS.HISTORY_WINDOW_SIZE.FREQ_HISTORY_WINDOW);
  private rawAmplitudeHistory: HistoryState = UTILS_AUDIO.createHistoryState(CONSTANTS.HISTORY_WINDOW_SIZE.FREQ_HISTORY_WINDOW);
  private prevLow: number = 0;
  private prevMid: number = 0;
  private prevHigh: number = 0;
  private prevKick: number = 0;
  private prevSnare: number = 0;
  private prevHihat: number = 0;
  private prevAmplitude: number = 0;
  private lastBeatTimes: { kick: number[]; snare: number[]; hihat: number[] } = { kick: [], snare: [], hihat: [] };
  private snareAverage: number = 0;
  private hihatAverage: number = 0;
  private prevFftBins: Float32Array | null = null;
  private spectralFlux: number = 0;
  private lastBeatTime: number = -Infinity;
  private beatTimes: number[] = [];
  private timelineMultiplier: number = 2;

  // Enhanced analysis internal states
  private spectralSpread: number = 0;
  private spectralSkewness: number = 0;
  private spectralKurtosis: number = 0;
  private noteProbabilities: Float32Array = new Float32Array(12);
  private onsetStrength: number = 0;
  private onsetType: 'percussive' | 'harmonic' | 'broadband' = 'broadband';
  private tempoConfidence: number = 0;

  private constructor() {
    this.enhancedAnalysis = EnhancedAudioAnalysis.getInstance();
  }

  static getInstance(): AudioProcessor {
    if (!AudioProcessor.instance) {
      AudioProcessor.instance = new AudioProcessor();
    }
    return AudioProcessor.instance;
  }

  update(deltaTime: number, frequencyData: Float32Array, currentState: Freq530State): Partial<Freq530State> {
    const now = performance.now() / 1000;

    // Get base state updates from existing logic
    const baseState = this.updateBaseState(deltaTime, frequencyData, currentState, now);

    if (!frequencyData || frequencyData.length === 0) {
      return baseState;
    }

    // Enhanced analysis
    const spectralFeatures = this.enhancedAnalysis.calculateSpectralFeatures(frequencyData, CONSTANTS.SAMPLE_RATE);
    const chromaFeatures = this.enhancedAnalysis.extractChromaFeatures(frequencyData, CONSTANTS.SAMPLE_RATE);
    const onsetResult = this.enhancedAnalysis.detectOnsets(frequencyData, CONSTANTS.SAMPLE_RATE, now);
    
    // Update internal states
    this.spectralSpread = spectralFeatures.spread;
    this.spectralSkewness = spectralFeatures.skewness;
    this.spectralKurtosis = spectralFeatures.kurtosis;
    this.noteProbabilities = chromaFeatures.noteProbabilities;
    this.onsetStrength = onsetResult.strength;
    this.onsetType = onsetResult.type;
    
    // Update beat times if onset detected
    if (onsetResult.isOnset) {
      this.beatTimes.push(now);
      // Keep only recent beat times
      this.beatTimes = this.beatTimes.filter(time => now - time < 5); // 5 second window
    }
    
    const tempoAnalysis = this.enhancedAnalysis.analyzeTempoAndPhase(this.beatTimes, now);
    this.tempoConfidence = tempoAnalysis.confidence;

    // Return only the essential features needed for visualization
    return {
      ...baseState,
      spectralCentroid: spectralFeatures.centroid,
      chromaVector: chromaFeatures.chromaVector,
      dominantNote: chromaFeatures.dominantNote,
      isOnset: onsetResult.isOnset,
      bpm: tempoAnalysis.bpm,
      tempoStability: tempoAnalysis.stability,
      beatPhase: tempoAnalysis.phase
    };
  }

  // Move existing update logic to a private method
  private updateBaseState(
    deltaTime: number,
    frequencyData: Float32Array,
    currentState: Freq530State,
    now: number
  ): Partial<Freq530State> {
    // Update time-related states
    const newTime = currentState.time + deltaTime;
    const newAdjustedTime = currentState.adjustedTime + deltaTime * currentState.amplitude;
    const newSin = Math.sin(newTime);
    const newCos = Math.cos(newTime);
    const newSinNormal = (newSin + 1) / 2;
    const newCosNormal = (newCos + 1) / 2;
    const newAdjustedSin = Math.sin(newAdjustedTime);
    const newAdjustedCos = Math.cos(newAdjustedTime);
    const newAdjustedSinNormal = (newAdjustedSin + 1) / 2;
    const newAdjustedCosNormal = (newAdjustedCos + 1) / 2;

    if (!frequencyData || frequencyData.length === 0) {
      return {
        time: newTime,
        adjustedTime: newAdjustedTime,
        sin: newSin,
        cos: newCos,
        sinNormal: newSinNormal,
        cosNormal: newCosNormal,
        adjustedSin: newAdjustedSin,
        adjustedCos: newAdjustedCos,
        adjustedSinNormal: newAdjustedSinNormal,
        adjustedCosNormal: newAdjustedCosNormal,
      };
    }

    // Update internal state
    this.frequencyData = frequencyData;

    // AMPLITUDE PATH
    const instantRawAmplitude = UTILS_AUDIO.calculateAmplitudeRMS(frequencyData);
    const rawAmplitudeState = UTILS_AUDIO.applyGainAndHistory(
      instantRawAmplitude,
      currentState.rawAmplitudeGain,
      this.rawAmplitudeHistory
    );
    const smoothedAmplitude = UTILS_AUDIO.applyEnvelope(rawAmplitudeState.value, this.prevAmplitude);
    const amplitudeState = UTILS_AUDIO.applyGainAndHistory(
      smoothedAmplitude,
      currentState.amplitudeGain,
      this.amplitudeHistory
    );

    // BEAT DETECTION PATH
    const kickEnergy = UTILS_AUDIO.calculateBeatBandEnergy(
      frequencyData,
      CONSTANTS.BEAT_DETECTION_PARAMETERS.KICK_FREQ_RANGE.min,
      CONSTANTS.BEAT_DETECTION_PARAMETERS.KICK_FREQ_RANGE.max,
      CONSTANTS.SAMPLE_RATE
    );
    const snareEnergy = UTILS_AUDIO.calculateBeatBandEnergy(
      frequencyData,
      CONSTANTS.BEAT_DETECTION_PARAMETERS.SNARE_FREQ_RANGE.min,
      CONSTANTS.BEAT_DETECTION_PARAMETERS.SNARE_FREQ_RANGE.max,
      CONSTANTS.SAMPLE_RATE
    );
    const hihatEnergy = UTILS_AUDIO.calculateBeatBandEnergy(
      frequencyData,
      CONSTANTS.BEAT_DETECTION_PARAMETERS.HIHAT_FREQ_RANGE.min,
      CONSTANTS.BEAT_DETECTION_PARAMETERS.HIHAT_FREQ_RANGE.max,
      CONSTANTS.SAMPLE_RATE
    );

    const kickState = UTILS_AUDIO.applyGainAndHistory(kickEnergy, currentState.kickGain, this.kickHistory);
    const snareState = UTILS_AUDIO.applyGainAndHistory(snareEnergy, currentState.snareGain, this.snareHistory);
    const hihatState = UTILS_AUDIO.applyGainAndHistory(hihatEnergy, currentState.hihatGain, this.hihatHistory);

    const { linearMagnitudes, isAudioActive, spectralFlux } = UTILS_AUDIO.processAudioData(
      frequencyData,
      this.prevFftBins
    );
    this.prevFftBins = linearMagnitudes;
    this.spectralFlux = spectralFlux;

    const beatDetection = UTILS_AUDIO.updateBeatDetection(
      kickState,
      snareState,
      hihatState,
      currentState.kickAverage || 0.00001,
      this.snareAverage || 0.00001,
      this.hihatAverage || 0.00001,
      spectralFlux,
      isAudioActive,
      this.lastBeatTime || now,
      now
    );

    const newBeatIntensity = UTILS_AUDIO.updateBeatIntensity(
      currentState.beatIntensity || 0,
      beatDetection.isBeatCandidate,
      beatDetection.combinedRatio,
      beatDetection.timeSinceLastBeat
    );

    const newBeatTimes = UTILS_AUDIO.updateBeatTimes(this.beatTimes, now, beatDetection.isBeatCandidate);
    this.beatTimes = newBeatTimes;

    const newBPS = UTILS_AUDIO.updateBPS(currentState.bps || 0, newBeatTimes);

    // FREQUENCY RANGES PATH
    const ranges = UTILS_AUDIO.useFrequencyRanges(new Float32Array(frequencyData), CONSTANTS.FREQUENCY_DATA_BUFFER_SIZE);

    const lowState = UTILS_AUDIO.applyGainAndHistory(ranges.low, currentState.lowGain, this.lowHistory);
    const midState = UTILS_AUDIO.applyGainAndHistory(ranges.mid, currentState.midGain, this.midHistory);
    const highState = UTILS_AUDIO.applyGainAndHistory(ranges.high, currentState.highGain, this.highHistory);

    const harmonicScore = UTILS_AUDIO.getHarmonicScore(frequencyData);
    const midVariance = UTILS_AUDIO.calculateMidVariance(midState.value, this.midHistory);
    const vocalLikelihood =
      harmonicScore * CONSTANTS.VOCAL_HARMONIC_WEIGHT +
      midState.value * CONSTANTS.VOCAL_MID_WEIGHT +
      (1 - midVariance) * CONSTANTS.VOCAL_VARIANCE_WEIGHT;
    const vocalState = UTILS_AUDIO.applyGainAndHistory(vocalLikelihood, currentState.vocalGain, this.vocalHistory);

    // Update internal prev states
    this.prevLow = lowState.value;
    this.prevMid = midState.value;
    this.prevHigh = highState.value;
    this.prevKick = kickState.value;
    this.prevSnare = snareState.value;
    this.prevHihat = hihatState.value;
    this.prevAmplitude = amplitudeState.value;
    this.snareAverage = beatDetection.snareAverage;
    this.hihatAverage = beatDetection.hihatAverage;
    this.lastBeatTime = beatDetection.isBeatCandidate ? now : this.lastBeatTime;

    return {
      time: newTime,
      adjustedTime: newAdjustedTime,
      sin: newSin,
      cos: newCos,
      sinNormal: newSinNormal,
      cosNormal: newCosNormal,
      adjustedSin: newAdjustedSin,
      adjustedCos: newAdjustedCos,
      adjustedSinNormal: newAdjustedSinNormal,
      adjustedCosNormal: newAdjustedCosNormal,
      low: lowState.value,
      mid: midState.value,
      high: highState.value,
      kick: kickState.value,
      snare: snareState.value,
      hihat: hihatState.value,
      vocalLikelihood: vocalState.value,
      amplitude: amplitudeState.value + 1,
      rawAmplitude: rawAmplitudeState.value,
      beatIntensity: newBeatIntensity,
      bps: newBPS,
      isAudioActive,
      kickAverage: beatDetection.kickAverage,
      kickGain: kickState.gain,
      snareGain: snareState.gain,
      hihatGain: hihatState.gain,
      vocalGain: vocalState.gain,
      amplitudeGain: amplitudeState.gain,
      rawAmplitudeGain: rawAmplitudeState.gain,
      lowGain: lowState.gain,
      midGain: midState.gain,
      highGain: highState.gain,
    };
  }

  // --- Enhanced Analysis Control ---
  static enableEnhancedAnalysis() {
    EnhancedAudioAnalysis.setFeatureFlags({
      onset: true,
      chroma: true,
      spectral: true,
      tempo: true,
    });
  }

  static disableEnhancedAnalysis() {
    EnhancedAudioAnalysis.setFeatureFlags({
      onset: false,
      chroma: false,
      spectral: false,
      tempo: false,
    });
  }

  static setEnhancedAnalysisFlags(flags: Partial<EnhancedAudioFeatureFlags>) {
    EnhancedAudioAnalysis.setFeatureFlags(flags);
  }

  static getEnhancedAnalysisFlags(): EnhancedAudioFeatureFlags {
    return EnhancedAudioAnalysis.getFeatureFlags();
  }
} 