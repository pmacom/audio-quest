import { CONSTANTS } from "../constants";
import { ChromaFeatures, OnsetDetectionResult, SpectralFeatures, TempoAnalysis } from "./types";

export type EnhancedAudioFeatureFlags = {
  onset: boolean;
  chroma: boolean;
  spectral: boolean;
  tempo: boolean;
};

// Enhanced analysis is OFF by default for performance. Enable via AudioProcessor.enableEnhancedAnalysis() or setEnhancedAnalysisFlags().
const DEFAULT_FEATURE_FLAGS: EnhancedAudioFeatureFlags = {
  onset: false,
  chroma: false,
  spectral: false,
  tempo: false,
};

export class EnhancedAudioAnalysis {
  private static instance: EnhancedAudioAnalysis;
  private static featureFlags: EnhancedAudioFeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
  
  // Onset detection state
  private previousSpectrum: Float32Array | null = null;
  private onsetMemory: CircularBuffer = new CircularBuffer(4); // Store recent onset times
  private spectralFluxHistory: CircularBuffer = new CircularBuffer(43); // About 1 second at 44.1kHz
  
  // Tempo tracking state
  private beatIntervalHistory: CircularBuffer = new CircularBuffer(86); // About 2 seconds
  private tempoEstimate: number = 120;
  private tempoConfidence: number = 0;
  
  private constructor() {}

  static getInstance(): EnhancedAudioAnalysis {
    if (!EnhancedAudioAnalysis.instance) {
      EnhancedAudioAnalysis.instance = new EnhancedAudioAnalysis();
    }
    return EnhancedAudioAnalysis.instance;
  }

  static setFeatureFlags(flags: Partial<EnhancedAudioFeatureFlags>) {
    EnhancedAudioAnalysis.featureFlags = { ...EnhancedAudioAnalysis.featureFlags, ...flags };
  }

  static getFeatureFlags(): EnhancedAudioFeatureFlags {
    return { ...EnhancedAudioAnalysis.featureFlags };
  }

  /**
   * Detect onsets (sudden changes) in the audio signal using multiple detection functions
   */
  detectOnsets(
    currentSpectrum: Float32Array,
    sampleRate: number,
    timeStamp: number
  ): OnsetDetectionResult {
    if (!EnhancedAudioAnalysis.featureFlags.onset) {
      return { isOnset: false, strength: 0, type: 'broadband' };
    }
    if (!this.previousSpectrum) {
      this.previousSpectrum = currentSpectrum.slice();
      return { isOnset: false, strength: 0, type: 'broadband' };
    }

    // Calculate different types of onset detection functions
    const spectralFlux = this.calculateSpectralFlux(currentSpectrum, this.previousSpectrum);
    const percussiveEnergy = this.calculatePercussiveEnergy(currentSpectrum);
    const harmonicChange = this.calculateHarmonicChange(currentSpectrum, this.previousSpectrum);

    // Update history
    this.spectralFluxHistory.push(spectralFlux);

    // Adaptive thresholding
    const medianFlux = this.calculateMedian(this.spectralFluxHistory.values);
    const threshold = medianFlux * 1.5;

    // Determine onset type and strength
    let isOnset = false;
    let strength = 0;
    let type: 'percussive' | 'harmonic' | 'broadband' = 'broadband';

    if (spectralFlux > threshold) {
      isOnset = true;
      strength = spectralFlux / threshold;

      // Classify onset type
      if (percussiveEnergy > harmonicChange * 1.5) {
        type = 'percussive';
      } else if (harmonicChange > percussiveEnergy * 1.5) {
        type = 'harmonic';
      }

      this.onsetMemory.push(timeStamp);
    }

    // Update state for next frame
    this.previousSpectrum = currentSpectrum.slice();

    return { isOnset, strength, type };
  }

  /**
   * Extract chroma features (pitch class profile) from the spectrum
   */
  extractChromaFeatures(spectrum: Float32Array, sampleRate: number): ChromaFeatures {
    if (!EnhancedAudioAnalysis.featureFlags.chroma) {
      return {
        chromaVector: new Float32Array(12).fill(0),
        dominantNote: -1,
        noteProbabilities: new Float32Array(12).fill(0),
      };
    }
    const fftSize = spectrum.length * 2;
    const binWidth = sampleRate / fftSize;
    const chromaVector = new Float32Array(12).fill(0);
    const noteProbabilities = new Float32Array(12).fill(0);
    const energyThreshold = -60; // dB threshold for considering a frequency bin

    // Map frequency bins to pitch classes with proper weighting
    for (let bin = 1; bin < spectrum.length; bin++) {  // Start from 1 to skip DC
      const frequency = bin * binWidth;
      // Only process bins with significant energy and in musical range
      if (frequency > 20 && frequency < 8000 && spectrum[bin] > energyThreshold) {
        const midiNote = 69 + 12 * Math.log2(frequency / 440);
        const pitchClass = ((Math.round(midiNote) % 12) + 12) % 12;  // Ensure positive
        const magnitude = Math.pow(10, spectrum[bin] / 20);  // Convert dB to magnitude
        
        // Weight by pitch accuracy and frequency range
        const pitchAccuracy = Math.abs(midiNote - Math.round(midiNote));
        const freqWeight = 1.0 / Math.sqrt(frequency); // Give less weight to higher frequencies
        const weight = (1.0 / (1.0 + pitchAccuracy)) * freqWeight;
        
        chromaVector[pitchClass] += magnitude * weight;
      }
    }

    // Normalize chroma vector with proper scaling
    const maxMagnitude = Math.max(...chromaVector);
    const minMagnitude = Math.min(...chromaVector);
    const range = maxMagnitude - minMagnitude;
    
    if (range > 0) {
      // Calculate mean for noise floor
      const mean = chromaVector.reduce((a, b) => a + b, 0) / 12;
      const noiseFloor = mean * 0.2; // 20% of mean as noise floor
      
      for (let i = 0; i < 12; i++) {
        // Apply noise gate before normalization
        const gatedValue = chromaVector[i] > noiseFloor ? chromaVector[i] : 0;
        noteProbabilities[i] = (gatedValue - minMagnitude) / range;
        chromaVector[i] = noteProbabilities[i];
      }
    }

    // Find dominant note with enhanced thresholding
    const DOMINANCE_THRESHOLD = 0.7; // Note must be significantly stronger than others
    const maxProb = Math.max(...noteProbabilities);
    const avgProb = noteProbabilities.reduce((a, b) => a + b, 0) / 12;
    
    // Only consider a note dominant if it's significantly above average
    // and above an absolute threshold
    const dominantNote = (maxProb > avgProb * DOMINANCE_THRESHOLD && maxProb > 0.4) ? 
      noteProbabilities.indexOf(maxProb) : 
      -1; // -1 indicates no dominant note

    return { chromaVector, dominantNote, noteProbabilities };
  }

  /**
   * Calculate spectral features including centroid, spread, skewness, and kurtosis
   */
  calculateSpectralFeatures(spectrum: Float32Array, sampleRate: number): SpectralFeatures {
    if (!EnhancedAudioAnalysis.featureFlags.spectral) {
      return { centroid: 0, spread: 0, skewness: 0, kurtosis: 0 };
    }
    const fftSize = spectrum.length * 2;
    const binWidth = sampleRate / fftSize;
    let totalMagnitude = 0;
    let weightedSum = 0;

    // Convert spectrum to linear magnitude and calculate initial sums
    const magnitudes = new Float32Array(spectrum.length);
    for (let i = 0; i < spectrum.length; i++) {
      const frequency = i * binWidth;
      const magnitude = Math.pow(10, spectrum[i] / 20);
      magnitudes[i] = magnitude;
      totalMagnitude += magnitude;
      weightedSum += magnitude * frequency;
    }

    // Calculate spectral centroid (brightness)
    const centroid = totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;

    // Calculate higher-order moments
    let m2 = 0, m3 = 0, m4 = 0;
    for (let i = 0; i < spectrum.length; i++) {
      const frequency = i * binWidth;
      const deviation = frequency - centroid;
      const sqrDev = deviation * deviation;
      m2 += sqrDev * magnitudes[i];
      m3 += sqrDev * deviation * magnitudes[i];
      m4 += sqrDev * sqrDev * magnitudes[i];
    }

    if (totalMagnitude > 0) {
      m2 /= totalMagnitude;
      m3 /= totalMagnitude;
      m4 /= totalMagnitude;
    }

    const spread = Math.sqrt(m2);
    const skewness = m2 > 0 ? m3 / Math.pow(m2, 1.5) : 0;
    const kurtosis = m2 > 0 ? m4 / (m2 * m2) : 0;

    return { centroid, spread, skewness, kurtosis };
  }

  /**
   * Improved tempo analysis using autocorrelation and beat phase tracking
   */
  analyzeTempoAndPhase(
    onsetTimes: number[],
    currentTime: number,
    windowSize: number = 5
  ): TempoAnalysis {
    if (!EnhancedAudioAnalysis.featureFlags.tempo) {
      return { bpm: 0, confidence: 0, stability: 0, phase: 0 };
    }
    // Filter recent onsets within the window
    const recentOnsets = onsetTimes.filter(t => currentTime - t < windowSize);
    
    if (recentOnsets.length < 4) {
      return {
        bpm: this.tempoEstimate,
        confidence: this.tempoConfidence * 0.95, // Decay confidence when insufficient data
        stability: 0.5,
        phase: 0
      };
    }

    // Calculate inter-onset intervals
    const intervals: number[] = [];
    for (let i = 1; i < recentOnsets.length; i++) {
      intervals.push(recentOnsets[i] - recentOnsets[i - 1]);
    }

    // Update beat interval history
    intervals.forEach(interval => this.beatIntervalHistory.push(interval));

    // Perform autocorrelation on beat intervals
    const acf = this.calculateAutocorrelation(this.beatIntervalHistory.values);
    
    // Find peaks in autocorrelation
    const peaks = this.findPeaks(acf);
    
    if (peaks.length > 0) {
      // Convert highest peak to BPM
      const dominantInterval = peaks[0].position * (windowSize / acf.length);
      const newBPM = 60 / dominantInterval;
      
      // Update tempo estimate with smoothing
      const alpha = 0.3; // Smoothing factor
      this.tempoEstimate = this.tempoEstimate * (1 - alpha) + newBPM * alpha;
      this.tempoConfidence = Math.min(peaks[0].magnitude, 1);
    }

    // Calculate tempo stability
    const stability = this.calculateTempoStability(intervals);

    // Calculate current phase
    const phase = this.calculateBeatPhase(recentOnsets, currentTime);

    return {
      bpm: this.tempoEstimate,
      confidence: this.tempoConfidence,
      stability,
      phase
    };
  }

  // Helper methods
  private calculateSpectralFlux(current: Float32Array, previous: Float32Array): number {
    let flux = 0;
    for (let i = 0; i < current.length; i++) {
      const diff = Math.pow(10, current[i] / 20) - Math.pow(10, previous[i] / 20);
      flux += Math.max(0, diff); // Only positive changes
    }
    return flux;
  }

  private calculatePercussiveEnergy(spectrum: Float32Array): number {
    let energy = 0;
    for (let i = Math.floor(spectrum.length * 0.1); i < Math.floor(spectrum.length * 0.5); i++) {
      energy += Math.pow(10, spectrum[i] / 20);
    }
    return energy;
  }

  private calculateHarmonicChange(current: Float32Array, previous: Float32Array): number {
    let change = 0;
    const harmonicRange = { start: Math.floor(current.length * 0.1), end: Math.floor(current.length * 0.8) };
    
    for (let i = harmonicRange.start; i < harmonicRange.end; i++) {
      const currentMag = Math.pow(10, current[i] / 20);
      const prevMag = Math.pow(10, previous[i] / 20);
      change += Math.abs(currentMag - prevMag);
    }
    return change;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculateAutocorrelation(signal: number[]): number[] {
    const n = signal.length;
    const result = new Array(n).fill(0);
    
    for (let lag = 0; lag < n; lag++) {
      for (let i = 0; i < n - lag; i++) {
        result[lag] += signal[i] * signal[i + lag];
      }
      if (lag > 0) result[lag] /= result[0]; // Normalize
    }
    
    return result;
  }

  private findPeaks(signal: number[]): Array<{ position: number; magnitude: number }> {
    const peaks: Array<{ position: number; magnitude: number }> = [];
    
    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) {
        peaks.push({ position: i, magnitude: signal[i] });
      }
    }
    
    return peaks.sort((a, b) => b.magnitude - a.magnitude);
  }

  private calculateTempoStability(intervals: number[]): number {
    if (intervals.length < 2) return 0.5;
    
    const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    
    // Convert variance to stability measure (0 to 1)
    return Math.exp(-variance / (mean * 0.5));
  }

  private calculateBeatPhase(onsets: number[], currentTime: number): number {
    if (onsets.length < 2) return 0;
    
    const lastBeat = onsets[onsets.length - 1];
    const expectedBeatInterval = 60 / this.tempoEstimate;
    
    // Calculate phase (0 to 1)
    return ((currentTime - lastBeat) % expectedBeatInterval) / expectedBeatInterval;
  }
}

// Helper class for circular buffer
class CircularBuffer {
  private buffer: number[];
  private pointer: number = 0;

  constructor(size: number) {
    this.buffer = new Array(size).fill(0);
  }

  push(value: number) {
    this.buffer[this.pointer] = value;
    this.pointer = (this.pointer + 1) % this.buffer.length;
  }

  get values(): number[] {
    return [...this.buffer.slice(this.pointer), ...this.buffer.slice(0, this.pointer)];
  }
} 