# Audio Visualizer Components

This directory contains React Three Fiber (R3F) components that visualize real-time audio data from the Rust audio processor. These components consume data from the `useFreq530` store and create dynamic 3D visualizations.

## Components

### AmplitudeVisualizer
A cube that scales uniformly based on the dynamic amplitude of the audio.

**Props:**
- `baseScale` (default: 0.2): Minimum scale of the cube
- `scaleMultiplier` (default: 1.8): How much the cube scales with amplitude
- `lerpFactor` (default: 0.1): Smoothing factor for animation
- `color` (default: "orange"): Color of the cube

**Data Source:** `amplitudeDynamic`

### BeatIntensityPulsar
A sphere that pulses and glows when beats are detected.

**Props:**
- `baseScale` (default: 1): Base scale of the sphere
- `maxScaleMultiplier` (default: 1.5): Maximum scale multiplier for pulses
- `emissiveMultiplier` (default: 0.8): How much the sphere glows
- `decaySpeed` (default: 5): How fast the pulse decays
- `color` (default: "red"): Base color of the sphere
- `emissiveColor` (default: "red"): Glow color

**Data Sources:** `beatIntensity`, `lastBeatTime`

### FrequencyBandsDisplay
A row of vertical bars representing energy across frequency bands.

**Props:**
- `maxHeight` (default: 5): Maximum height of bars
- `spacing` (default: 0.5): Space between bars
- `barWidth` (default: 0.4): Width of each bar
- `barDepth` (default: 0.4): Depth of each bar
- `lerpFactor` (default: 0.2): Animation smoothing
- `minHeight` (default: 0.01): Minimum bar height

**Data Source:** `quantizedBands` (array of 32 frequency band values)

### SpectralFluxColorShift
A sphere that changes color based on spectral flux (rate of spectral change).

**Props:**
- `radius` (default: 0.7): Size of the sphere
- `lerpFactor` (default: 0.1): Color transition smoothing
- `saturation` (default: 0.8): Color saturation
- `lightness` (default: 0.5): Color lightness
- `minHue`/`maxHue` (default: 0.0/0.7): Hue range for color mapping

**Data Source:** `spectralFlux`

### BeatPhaseAnimator

A cube that oscillates based on the calculated beat phase and timing.

**Props:**
- `size` (default: 0.5): Size of the cube
- `oscillationAmplitude` (default: 0.5): How much the cube moves
- `color` (default: "lightgreen"): Color of the cube

**Data Source:** `time`, `bps` (calculates its own phase from beat timing)

### DeformablePlane
A dynamic, deformable surface that creates wave-like terrains based on the audio's spectral content.

**Props:**
- `width` (default: 10): Width of the plane
- `height` (default: 10): Height of the plane
- `segmentsX` (default: 15): Number of width segments (more = higher detail)
- `segmentsY` (default: 15): Number of height segments (more = higher detail)
- `maxDisplacement` (default: 2): Maximum displacement height for vertices
- `lerpFactor` (default: 0.1): Smoothing factor for deformation
- `color` (default: "deepskyblue"): Color of the plane
- `wireframe` (default: false): Whether to show as wireframe

**Data Source:** `frequencyGridMap` (256-value array representing a 16x16 grid of audio energy)

**Note:** The DeformablePlane maps a 1D frequency grid array to a 2D plane surface. Each vertex of the plane corresponds to a value in the frequency grid, creating dynamic terrain that responds to different frequency bands across the audio spectrum.

### DemoAudioVisualizersLayout
A demonstration layout showing all visualizers arranged in a 3D space.

## Usage

### Basic Usage
```jsx
import { AmplitudeVisualizer, BeatIntensityPulsar } from '@/Freq532/components';

function MyScene() {
  return (
    <Canvas>
      <AmplitudeVisualizer position={[-2, 0, 0]} />
      <BeatIntensityPulsar position={[2, 0, 0]} />
    </Canvas>
  );
}
```

### Demo Layout
```jsx
import { DemoAudioVisualizersLayout, DeformablePlane } from '@/Freq532/components';

function AudioVisualizationDemo() {
  return (
    <Canvas camera={{ position: [0, 2, 15], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <DemoAudioVisualizersLayout />

      <DeformablePlane 
        position={[0, 0, 0]}
        width={8}
        height={6}
        maxDisplacement={2}
        wireframe={true}
      />
    </Canvas>
  );
}
```

### With Audio Connection
Make sure to initialize the WebSocket connection to receive audio data:

```jsx
import { useFreq530 } from '@/Freq532/audio/store/useFreq530';
import { useEffect } from 'react';

function AudioApp() {
  const connectWebSocket = useFreq530(state => state.connectWebSocket);
  
  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  return (
    <Canvas>
      {/* Your visualizers here */}
    </Canvas>
  );
}
```

## Data Flow

1. Rust audio processor analyzes audio input
2. Processes audio data into frequency bands, beat detection, etc.
3. Sends data via WebSocket using Protocol Buffers
4. `useFreq530` store receives and processes the data
5. Visualizer components subscribe to specific data fields
6. Components update their visual properties in real-time

## Customization

All components are designed to be highly customizable through props. You can:

- Adjust visual properties (colors, sizes, animation speeds)
- Position components anywhere in 3D space
- Combine multiple visualizers for complex scenes
- Create your own visualizers using the same data sources

## Performance Considerations

- All animations use smooth interpolation (`lerp`) to prevent jarring movements
- Components only update when their subscribed data changes
- Geometry is reused when possible to minimize memory usage
- Consider the number of frequency bands (32 by default) when using FrequencyBandsDisplay

## Audio Data Fields

The components use these fields from the audio processor:

- `amplitudeDynamic`: Normalized dynamic amplitude (0-1)
- `beatIntensity`: Current beat strength (0-1)
- `lastBeatTime`: Timestamp of last detected beat
- `quantizedBands`: Array of 32 frequency band values (0-255)
- `spectralFlux`: Rate of spectral change (0-1)
- `time`: Current time in seconds
- `bps`: Beats per second
- `low`, `mid`, `high`: Frequency ranges (0-1)
- `kick`, `snare`, `hihat`: Drum component detection (0-1)

## Troubleshooting

**No animation:** Ensure WebSocket connection is established and audio is playing
**Poor performance:** Reduce the number of visualizers or adjust animation smoothing
**Missing data:** Check that the Rust audio processor is running and broadcasting data 