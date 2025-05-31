# Freq530 Audio System Documentation

## Overview
The Freq530 audio system is designed to process real-time audio data and provide various audio analysis features including beat detection, frequency analysis, and vocal detection. The system is built around a central Zustand store (`useAudioStateStore`) that maintains the audio state and processes incoming audio data.

## Core Components

### 1. Audio State Store (`useAudioStateStore`)
The central state management system that handles:
- Real-time audio processing
- State updates for audio features
- Time-based animations and transitions
- Beat detection and analysis

#### Key State Properties
```typescript
interface AudioStateStore {
  // Time-related
  time: number;
  adjustedAccumulatedTime: number;
  timelineMultiplier: number;

  // Audio Analysis
  frequencyData: Float32Array;
  low: number;
  mid: number;
  high: number;
  amplitude: number;
  rawAmplitude: number;

  // Beat Detection
  kick: number;
  snare: number;
  hihat: number;
  beatIntensity: number;
  bps: number;
  isAudioActive: boolean;

  // Vocal Detection
  vocalLikelihood: number;

  // Gain Controls
  lowGain: number;
  midGain: number;
  highGain: number;
  kickGain: number;
  snareGain: number;
  hihatGain: number;
  vocalGain: number;
  amplitudeGain: number;
}
```

### 2. Audio Utilities (`audio/utils.ts`)
Collection of utility functions for audio processing:

#### Core Audio Processing
- `calculateAmplitudeRMS`: Calculates root mean square amplitude
- `dbToMagnitude`: Converts decibel values to linear magnitude
- `normalizeDecibelValue`: Normalizes dB values to 0-1 range

#### Beat Detection
- `calculateBeatBandEnergy`: Analyzes energy in specific frequency bands
- `updateBeatDetection`: Processes beat detection for kick, snare, and hihat
- `updateBeatIntensity`: Calculates beat intensity based on detection
- `updateBPS`: Updates beats per second calculations

#### Frequency Analysis
- `useFrequencyRanges`: Splits frequency data into low, mid, and high ranges
- `getHarmonicScore`: Analyzes harmonic content for vocal detection
- `calculateSpectralFlux`: Measures changes in frequency content

### 3. Time Utilities (`time/utils.ts`)
Handles time-based calculations and animations:
- `updateTimeValues`: Calculates time-based values (sin, cos)
- `updateMirrorValue`: Creates mirror-like animations
- `updateEasedMirrorValue`: Adds easing to mirror animations
- `calculateAdjustedAccumulatedTime`: Manages accumulated time for animations

## Usage Guide

### Reading Audio Data
```typescript
import { useAudioStateStore } from '../stores/useAudioStateStore';

// Method 1: Individual selectors (preferred for performance)
const low = useAudioStateStore((state) => state.low);
const mid = useAudioStateStore((state) => state.mid);
const high = useAudioStateStore((state) => state.high);

// Method 2: Multiple selectors in one subscription
const { kick, snare, hihat, beatIntensity } = useAudioStateStore((state) => ({
  kick: state.kick,
  snare: state.snare,
  hihat: state.hihat,
  beatIntensity: state.beatIntensity
}));

// Example: React to beat intensity
useEffect(() => {
  if (beatIntensity > 0.8) {
    // Handle strong beat
  }
}, [beatIntensity]);
```

### Writing Audio Data
```typescript
import { useAudioStateStore } from '../stores/useAudioStateStore';

// Get the setFrequencyData function using a selector
const setFrequencyData = useAudioStateStore((state) => state.setFrequencyData);

// Update audio data (typically from an AudioAnalyser)
const updateAudio = (frequencyData: Float32Array, deltaTime: number) => {
  setFrequencyData(frequencyData, deltaTime);
};
```

### Adjusting Gains
```typescript
import { useAudioStateStore } from '../stores/useAudioStateStore';

// Method 1: Using set to update multiple values
const updateGains = () => {
  useAudioStateStore.setState((state) => ({
    ...state,
    kickGain: 1.5,    // Boost kick detection
    vocalGain: 0.8,   // Reduce vocal sensitivity
    hihatGain: 1.2    // Slightly boost hihat
  }));
};

// Method 2: Using set to update a single value
const boostKick = () => {
  useAudioStateStore.setState((state) => ({
    ...state,
    kickGain: state.kickGain * 1.2 // Increase kick gain by 20%
  }));
};

// Method 3: Reading current values and updating
const Component = () => {
  // Get the current state
  const kickGain = useAudioStateStore((state) => state.kickGain);
  
  const handleGainAdjustment = () => {
    useAudioStateStore.setState((state) => ({
      ...state,
      kickGain: Math.min(state.kickGain + 0.1, 2.0) // Increment with upper limit
    }));
  };

  return (
    <button onClick={handleGainAdjustment}>
      Increase Kick Gain (Current: {kickGain.toFixed(2)})
    </button>
  );
};
```

Note: Always use `setState` to update store values. Direct assignment (`store.kickGain = 1.5`) won't work with Zustand stores.

## Best Practices

1. **Performance**
   - Audio processing happens in real-time
   - Minimize calculations in render loops
   - Use memoization for expensive computations

2. **State Updates**
   - Audio state updates frequently (typically 60fps)
   - Use selectors to prevent unnecessary re-renders
   - Subscribe only to needed values

3. **Gain Adjustment**
   - Start with default gains of 1.0
   - Adjust gradually for optimal detection
   - Monitor `isAudioActive` for signal presence

4. **Beat Detection**
   - Check `beatIntensity` for overall beat strength
   - Use individual `kick`, `snare`, `hihat` for specific triggers
   - `bps` provides tempo information

## Constants and Configuration

Key constants that affect audio processing are defined in `constants.ts`:

```typescript
export const CONSTANTS = {
  FREQUENCY_DATA_BUFFER_SIZE: 1024,
  SAMPLE_RATE: 44100,
  DECAY_RATE: 0.8,
  BEAT_DETECTION_PARAMETERS: {
    BEAT_ALPHA: 0.7,
    BEAT_THRESHOLD: 1.05,
    MIN_BEAT_INTERVAL: 0.2,
    BEAT_DECAY_RATE: 0.8,
    KICK_FREQ_RANGE: { min: 40, max: 100 },
    SNARE_FREQ_RANGE: { min: 120, max: 500 },
    HIHAT_FREQ_RANGE: { min: 2000, max: 10000 }
  },
  HISTORY_WINDOW_SIZE: {
    FREQ_HISTORY_WINDOW: 60,  // 1 second at 60fps
    BEAT_HISTORY_WINDOW: 30,  // 0.5 seconds at 60fps
    VOCAL_HISTORY_WINDOW: 45  // 0.75 seconds at 60fps
  },
  TARGET_RANGES: {
    MIN: 0.1,
    MAX: 0.9
  }
};
```

These constants control various aspects of the audio processing:
- `FREQUENCY_DATA_BUFFER_SIZE`: Size of the FFT analysis window
- `BEAT_DETECTION_PARAMETERS`: Fine-tune beat detection sensitivity and frequency ranges
- `HISTORY_WINDOW_SIZE`: Control the length of history buffers for smoothing
- `TARGET_RANGES`: Define the target range for normalized values

## Audio Processing Systems

### History Buffer System
The Freq530 audio system uses circular buffers to maintain a history of audio features. This system is crucial for:
- Smoothing out rapid changes in audio signals
- Calculating running averages
- Detecting patterns over time
- Auto-adjusting gain levels

```typescript
interface HistoryState {
  buffer: CircularBuffer;  // Circular buffer of fixed size
  min: number;            // Minimum value in current buffer
  max: number;            // Maximum value in current buffer
}
```

Each audio feature (frequency bands, beats, vocals) has its own history buffer with specific window sizes:
- Frequency analysis: 60 frames (1 second at 60fps)
- Beat detection: 30 frames (0.5 seconds)
- Vocal detection: 45 frames (0.75 seconds)

The history system automatically:
1. Updates min/max values when new data arrives
2. Maintains a sliding window of recent values
3. Provides normalized values based on the history range

Example of history-based normalization:
```typescript
const normalize = (value: number, history: HistoryState) => {
  if (history.max === history.min) return value;
  return (value - history.min) / (history.max - history.min);
};
```

### Beat Detection Algorithm
The beat detection system uses multiple techniques to accurately identify beats:

1. **Frequency Band Analysis**
```typescript
// Analyze specific frequency ranges for different drum elements
const kickEnergy = calculateBeatBandEnergy(
  frequencyData,
  CONSTANTS.BEAT_DETECTION_PARAMETERS.KICK_FREQ_RANGE.min,  // 40Hz
  CONSTANTS.BEAT_DETECTION_PARAMETERS.KICK_FREQ_RANGE.max   // 100Hz
);
```

2. **Energy Detection**
- Kick: 40-100 Hz (bass drum)
- Snare: 120-500 Hz (snare drum)
- Hihat: 2000-10000 Hz (cymbals)

3. **Onset Detection**
```typescript
const isBeatCandidate = 
  isAudioActive &&
  combinedRatio > CONSTANTS.BEAT_DETECTION_PARAMETERS.BEAT_THRESHOLD &&
  spectralFlux > CONSTANTS.BEAT_DETECTION_PARAMETERS.SPECTRAL_FLUX_THRESHOLD &&
  timeSinceLastBeat > CONSTANTS.BEAT_DETECTION_PARAMETERS.MIN_BEAT_INTERVAL;
```

4. **Beat Intensity Calculation**
- Uses a decay function for smooth transitions
- Combines multiple detection methods
- Provides continuous intensity value (0-1)

### Vocal Detection System
The vocal detection system uses multiple parameters to identify vocal content:

1. **Harmonic Analysis**
```typescript
const harmonicScore = getHarmonicScore(frequencyData);
// Analyzes harmonic content in vocal frequency range (100Hz-10kHz)
```

2. **Mid-Range Energy**
- Focuses on typical vocal frequencies
- Tracks energy in the mid-frequency band
- Uses variance to detect sustained notes

3. **Combined Detection**
```typescript
const vocalLikelihood = (
  harmonicScore * CONSTANTS.VOCAL_HARMONIC_WEIGHT +
  midValue * CONSTANTS.VOCAL_MID_WEIGHT +
  (1 - midVariance) * CONSTANTS.VOCAL_VARIANCE_WEIGHT
);
```

### Auto-Gain System
The system automatically adjusts gain levels to maintain optimal signal levels:

1. **Target Ranges**
```typescript
const TARGET_RANGES = {
  MIN: 0.1,  // Minimum target level
  MAX: 0.9   // Maximum target level
};
```

2. **Gain Adjustment**
```typescript
if (normalizedValue < TARGET_RANGES.MIN) {
  gain += CONSTANTS.GAIN_ADJUST_RATE;
} else if (normalizedValue > TARGET_RANGES.MAX) {
  gain -= CONSTANTS.GAIN_ADJUST_RATE;
}
```

## Performance Optimization

### 1. Selective Updates
```typescript
// BAD: Subscribing to entire store
const store = useAudioStateStore();

// GOOD: Selective subscription
const beatIntensity = useAudioStateStore(
  (state) => state.beatIntensity
);
```

### 2. Memoization Strategies
```typescript
// Memoize expensive calculations
const memoizedProcessor = useMemo(() => {
  return (data: Float32Array) => {
    // Complex audio processing
  };
}, []);

// Memoize component based on audio props
const AudioVisualizer = memo(({ beatIntensity }) => {
  return <div style={{ transform: `scale(${1 + beatIntensity})` }} />;
});
```

### 3. Frame Skipping
The system includes optional frame skipping for performance:
```typescript
if (CONSTANTS.ENABLE_FRAME_SKIP && frameCount % CONSTANTS.FRAME_SKIP_COUNT !== 0) {
  return; // Skip this frame
}
```

### 4. Efficient Data Structures
- Uses TypedArrays (Float32Array) for audio data
- Implements circular buffers for history
- Minimizes garbage collection

### 5. Batched Updates
```typescript
// Batch multiple audio feature updates
useAudioStateStore.setState((state) => ({
  ...state,
  kick: kickState.value,
  snare: snareState.value,
  hihat: hihatState.value,
  beatIntensity: newBeatIntensity
}));
```

## Debug and Monitoring

The system includes comprehensive debugging features:
```typescript
const DEBUG = {
  ENABLE_LOGGING: true,
  LOG_FREQUENCY_DATA: false,
  LOG_FREQUENCY_BANDS: false,
  LOG_HARMONICS: false,
  LOG_AMPLITUDES: false,
  LOG_HISTORY: false,
  LOG_BEAT_DETECTION: false
};
```

Enable these flags to monitor different aspects of the audio processing system.

## Examples

### Basic Beat Reaction
```typescript
const BeatVisualizer = () => {
  const beatIntensity = useAudioStateStore(state => state.beatIntensity);
  
  return (
    <div style={{
      transform: `scale(${1 + beatIntensity * 0.5})`
    }}>
      ●
    </div>
  );
};
```

### Frequency Visualization
```typescript
const FrequencyBars = () => {
  const { low, mid, high } = useAudioStateStore();
  
  return (
    <div className="bars">
      <div style={{ height: `${low * 100}%` }} />
      <div style={{ height: `${mid * 100}%` }} />
      <div style={{ height: `${high * 100}%` }} />
    </div>
  );
};
```

## Troubleshooting

Common issues and solutions:

1. **No Audio Detection**
   - Check `isAudioActive` status
   - Verify audio input source
   - Adjust gain values

2. **Poor Beat Detection**
   - Fine-tune `BEAT_THRESHOLD`
   - Adjust individual gains
   - Check frequency ranges

3. **Performance Issues**
   - Reduce update frequency
   - Optimize render loops
   - Use selective subscriptions

## Future Considerations

Planned improvements and considerations:
- Machine learning for better beat detection
- Additional audio features (chord detection, pitch tracking)
- WebAssembly optimization for processing
- Multi-channel audio support
