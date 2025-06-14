# Conceptual R3F Audio Visualizer Components

This document provides conceptual blueprints for creating React Three Fiber (R3F) components to visualize various audio data points broadcast from the Rust audio processor. These descriptions are intended to guide your implementation using your existing `useFreq530` Zustand store.

## Directory Structure Suggestion

Consider placing these visualizer components in a dedicated directory, for example:
`Frontend/src/components/audio_visualizers/`

## Main Demo Layout Component

This component would be responsible for fetching data from the `useFreq530` store and passing relevant parts to individual visualizer components. It would also arrange them in a simple layout for easy viewing.

**Filename:** `DemoAudioVisualizersLayout.jsx`

**Conceptual Structure:**

```jsx
// Frontend/src/components/audio_visualizers/DemoAudioVisualizersLayout.jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useFreq530 } from '../../stores/useFreq530'; // Adjust path as needed

// Import individual visualizer components
import AmplitudeVisualizer from './AmplitudeVisualizer';
import BeatIntensityPulsar from './BeatIntensityPulsar';
import FrequencyBandsDisplay from './FrequencyBandsDisplay';
import SpectralCentroidColorShift from './SpectralCentroidColorShift';
import ChromagramVisualizer from './ChromagramVisualizer';
import BeatPhaseAnimator from './BeatPhaseAnimator';
// ... import others as they are created

export default function DemoAudioVisualizersLayout() {
  // Subscribe to all data from the store
  // Alternatively, select specific fields if performance is a concern
  const audioData = useFreq530(state => state.data); // Assuming 'data' holds the PrimaryFreq530State object

  if (!audioData) {
    return <div>Loading audio data...</div>; // Or some other placeholder
  }

  return (
    <Canvas style={{ height: '100vh', width: '100vw' }} camera={{ position: [0, 2, 15], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Environment preset="sunset" />
      <OrbitControls />

      {/* Arrange components in a grid or row for demonstration */}
      <group position={[-6, 0, 0]}>
        <AmplitudeVisualizer amplitude_dynamic={audioData.amplitude_dynamic} />
        {/* Add a label in 3D space if desired */}
      </group>

      <group position={[-3, 0, 0]}>
        <BeatIntensityPulsar beat_intensity={audioData.beat_intensity} last_beat_time={audioData.last_beat_time} />
      </group>

      <group position={[0, -2, 0]}> {/* Positioned lower to see bands better */}
         <FrequencyBandsDisplay quantized_bands={audioData.quantized_bands} />
      </group>

      <group position={[3, 0, 0]}>
        <SpectralCentroidColorShift spectral_centroid={audioData.spectral_centroid} />
      </group>

      <group position={[6, 0, 0]}>
         <ChromagramVisualizer chromagram={audioData.chromagram} />
      </group>

      <group position={[9, 0, 0]}>
        <BeatPhaseAnimator beat_phase={audioData.beat_phase} />
      </group>

      {/* Add other visualizers similarly, adjusting positions */}

    </Canvas>
  );
}
```

---

## Individual Visualizer Components

### 1. Amplitude Visualizer

*   **Suggested Filename:** `AmplitudeVisualizer.jsx`
*   **Purpose:** Visualizes the overall dynamic amplitude of the audio.
*   **Props:**
    *   `amplitude_dynamic` (Number, 0-1): The dynamic amplitude value from the store.
*   **Visuals:** A simple cube that uniformly scales.
*   **Data Mapping:** `amplitude_dynamic` controls the `scale` of the cube.
*   **Conceptual Structure:**

    ```jsx
    // Frontend/src/components/audio_visualizers/AmplitudeVisualizer.jsx
    import React from 'react';
    import { useFrame } from '@react-three/fiber';
    import * as THREE from 'three';

    export default function AmplitudeVisualizer({ amplitude_dynamic }) {
      const meshRef = React.useRef();
      const targetScale = React.useMemo(() => new THREE.Vector3(), []);

      useFrame(() => {
        const currentScale = 0.5 + (amplitude_dynamic || 0) * 1.5;
        targetScale.set(currentScale, currentScale, currentScale);
        if (meshRef.current) {
          // Smooth scaling (lerp)
          meshRef.current.scale.lerp(targetScale, 0.1);
        }
      });

      return (
        <mesh ref={meshRef} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      );
    }
    ```

### 2. Beat Intensity Pulsar

*   **Suggested Filename:** `BeatIntensityPulsar.jsx`
*   **Purpose:** Visualizes the intensity of detected beats.
*   **Props:**
    *   `beat_intensity` (Number, ~0-1): Strength of the current beat.
    *   `last_beat_time` (Number): Timestamp of the last beat (can be used to trigger pulse on change).
*   **Visuals:** A sphere that quickly scales up and emits light on a beat, then smoothly returns to normal.
*   **Data Mapping:** `beat_intensity` determines peak scale/emissive strength. Change in `last_beat_time` triggers the pulse.
*   **Conceptual Structure (using `react-spring` for animation would be ideal):**

    ```jsx
    // Frontend/src/components/audio_visualizers/BeatIntensityPulsar.jsx
    import React, { useRef, useEffect, useState } from 'react';
    import { useFrame } from '@react-three/fiber';
    import * as THREE from 'three';
    // For a proper pulse, consider a spring library like @react-spring/three

    export default function BeatIntensityPulsar({ beat_intensity, last_beat_time }) {
      const meshRef = useRef();
      const [scale, setScale] = useState(1);
      const [emissive, setEmissive] = useState(0);
      const prevBeatTimeRef = useRef(last_beat_time);

      useEffect(() => {
        if (last_beat_time !== prevBeatTimeRef.current && last_beat_time > 0) {
          prevBeatTimeRef.current = last_beat_time;
          // Trigger pulse: Max scale & emissive based on beat_intensity
          setScale(1 + (beat_intensity || 0) * 1.5);
          setEmissive((beat_intensity || 0) * 0.8);
        }
      }, [last_beat_time, beat_intensity]);

      useFrame(() => {
        // Smoothly return to base state
        setScale(current => THREE.MathUtils.lerp(current, 1, 0.1));
        setEmissive(current => THREE.MathUtils.lerp(current, 0, 0.08));
        if (meshRef.current) {
          meshRef.current.scale.set(scale, scale, scale);
          meshRef.current.material.emissiveIntensity = emissive;
        }
      });

      return (
        <mesh ref={meshRef} castShadow receiveShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={emissive} />
        </mesh>
      );
    }
    ```

### 3. Frequency Bands Display

*   **Suggested Filename:** `FrequencyBandsDisplay.jsx`
*   **Purpose:** Visualizes energy across different frequency bands.
*   **Props:**
    *   `quantized_bands` (Array of Numbers, 0-255): Energy values for each band.
*   **Visuals:** A row of vertical bars, height corresponding to band energy.
*   **Data Mapping:** Each bar's `scale.y` is proportional to its `band_value`.
*   **Conceptual Structure:**

    ```jsx
    // Frontend/src/components/audio_visualizers/FrequencyBandsDisplay.jsx
    import React, { useRef } from 'react';
    import { useFrame } from '@react-three/fiber';
    import * as THREE from 'three';

    const Bar = React.memo(({ id, initialX, bandValue, maxHeight, color }) => {
      const meshRef = useRef();
      const targetScaleY = React.useRef(0.01); // Start small

      useFrame(() => {
        targetScaleY.current = Math.max(0.01, (bandValue / 255) * maxHeight);
        if (meshRef.current) {
          meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScaleY.current, 0.2);
          meshRef.current.position.y = meshRef.current.scale.y / 2;
        }
      });

      return (
        <mesh ref={meshRef} position={[initialX, 0.005, 0]} scale={[0.4, 0.01, 0.4]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    });

    export default function FrequencyBandsDisplay({ quantized_bands }) {
      const maxHeight = 5;
      const numBands = quantized_bands?.length || 32; // Default to 32 if not provided early
      const spacing = 0.5;

      return (
        <group>
          {(quantized_bands || Array(numBands).fill(0)).map((value, index) => {
            const initialX = (index - numBands / 2 + 0.5) * spacing;
            // Simple color gradient for bands
            const hue = index / numBands;
            const color = new THREE.Color().setHSL(hue, 0.7, 0.6);
            return <Bar key={index} id={index} initialX={initialX} bandValue={value} maxHeight={maxHeight} color={color} />;
          })}
        </group>
      );
    }
    ```

### 4. Spectral Centroid Color Shift

*   **Suggested Filename:** `SpectralCentroidColorShift.jsx`
*   **Purpose:** Visualizes spectral brightness.
*   **Props:**
    *   `spectral_centroid` (Number, 0-1): Normalized spectral centroid.
*   **Visuals:** An object (e.g., sphere) whose material color shifts.
*   **Data Mapping:** `spectral_centroid` maps to a color gradient (e.g., via HSL).
*   **Conceptual Structure:**

    ```jsx
    // Frontend/src/components/audio_visualizers/SpectralCentroidColorShift.jsx
    import React, { useRef } from 'react';
    import { useFrame } from '@react-three/fiber';
    import * as THREE from 'three';

    export default function SpectralCentroidColorShift({ spectral_centroid }) {
      const meshRef = useRef();
      const materialColor = React.useMemo(() => new THREE.Color(), []);

      useFrame(() => {
        // Map spectral_centroid (0-1) to hue (e.g., 0 is red, 0.7 is blue)
        // Adjust saturation (0.0-1.0) and lightness (0.0-1.0) as desired
        materialColor.setHSL(THREE.MathUtils.lerp(0.0, 0.7, spectral_centroid || 0), 0.8, 0.5);
        if (meshRef.current) {
          meshRef.current.material.color.lerp(materialColor, 0.1);
        }
      });

      return (
        <mesh ref={meshRef} castShadow receiveShadow>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial color="white" /> {/* Initial color, will be updated */}
        </mesh>
      );
    }
    ```

### 5. Chromagram Visualizer

*   **Suggested Filename:** `ChromagramVisualizer.jsx`
*   **Purpose:** Visualizes harmonic content (12 pitch classes).
*   **Props:**
    *   `chromagram` (Array of 12 Numbers, 0-1): Energy for each pitch class.
*   **Visuals:** 12 objects in a circle, emissive intensity/scale by pitch class energy.
*   **Data Mapping:** Each object's visual property (e.g., emission) is driven by its corresponding `chroma_value`.
*   **Conceptual Structure:**

    ```jsx
    // Frontend/src/components/audio_visualizers/ChromagramVisualizer.jsx
    import React, { useRef } from 'react';
    import { useFrame } from '@react-three/fiber';
    import * as THREE from 'three';

    const ChromaBar = React.memo(({ id, angle, radius, chromaValue, color }) => {
      const meshRef = useRef();
      const targetScaleY = React.useRef(0.1);

      useFrame(() => {
        targetScaleY.current = 0.1 + (chromaValue || 0) * 1.5; // Min height + scaled height
        if (meshRef.current) {
          meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScaleY.current, 0.2);
          meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(meshRef.current.material.emissiveIntensity, (chromaValue || 0) * 0.8, 0.2);
        }
      });

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      return (
        <mesh ref={meshRef} position={[x, (0.1 + (chromaValue || 0) * 1.5)/2, z]} scale={[0.3, 0.1, 0.3]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0} />
        </mesh>
      );
    });


    export default function ChromagramVisualizer({ chromagram }) {
      const radius = 2.5;
      // Define 12 distinct colors for pitch classes, e.g., based on a color wheel
      const pitchColors = React.useMemo(() =>
        Array(12).fill(null).map((_, i) => new THREE.Color().setHSL(i / 12, 0.7, 0.6))
      , []);

      return (
        <group>
          {(chromagram || Array(12).fill(0)).map((value, index) => {
            const angle = (index / 12) * Math.PI * 2;
            return <ChromaBar key={index} id={index} angle={angle} radius={radius} chromaValue={value} color={pitchColors[index]}/>;
          })}
        </group>
      );
    }
    ```

### 6. Beat Phase Animator

*   **Suggested Filename:** `BeatPhaseAnimator.jsx`
*   **Purpose:** Visualizes progress towards the next beat.
*   **Props:**
    *   `beat_phase` (Number, 0-1): Normalized beat phase.
*   **Visuals:** An object smoothly moving or rotating in a cycle.
*   **Data Mapping:** `beat_phase` directly drives an animation cycle (e.g., `sin(beat_phase * 2PI)` for position, or `beat_phase * 2PI` for rotation).
*   **Conceptual Structure:**

    ```jsx
    // Frontend/src/components/audio_visualizers/BeatPhaseAnimator.jsx
    import React, { useRef } from 'react';
    import { useFrame } from '@react-three/fiber';
    import * as THREE from 'three';

    export default function BeatPhaseAnimator({ beat_phase }) {
      const meshRef = useRef();

      useFrame(() => {
        if (meshRef.current) {
          const angle = (beat_phase || 0) * Math.PI * 2;
          meshRef.current.rotation.z = angle;
          meshRef.current.position.y = Math.sin(angle) * 0.5; // Example oscillation
        }
      });

      return (
        <mesh ref={meshRef} position={[0,0,0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="lightgreen" />
        </mesh>
      );
    }
    ```

### 7. Other Suggested Features (Simpler Conceptual Visuals)

For brevity, these are more condensed:

*   **`SpectralCrestDefiner.jsx`**
    *   **Props:** `spectral_crest` (0-1, peakiness).
    *   **Visual:** Torus. `tube` radius: `0.5 - spectral_crest * 0.4` (thin for tonal, thick for noisy).
    *   **Structure:** `<mesh><torusGeometry args={[0.6, tubeRadius, 16, 32]} /><meshStandardMaterial color="purple" /></mesh>` (ensure `tubeRadius` is a state/ref updated in `useFrame`).

*   **`SpectralRolloffVisualizer.jsx`**
    *   **Props:** `spectral_rolloff` (0-1, where energy is concentrated).
    *   **Visual:** Plane with a custom shader where `spectral_rolloff` controls a gradient or texture cutoff.
    *   **Structure:** Requires a `shaderMaterial`. `uniforms.uRolloff.value = spectral_rolloff;` (update in `useFrame`).

*   **`SpectralFlatnessNoisiness.jsx`**
    *   **Props:** `spectral_flatness` (0-1, noise vs. tone).
    *   **Visual:** Sphere. `material.roughness = 1.0 - spectral_flatness`. (Tonal = smooth, noisy = rough).
    *   **Structure:** `<mesh><sphereGeometry /><meshStandardMaterial color="skyblue" roughness={...} /></mesh>` (update `roughness` in `useFrame`).

*   **`OnsetStrengthEmitter.jsx`**
    *   **Props:** `onset_strength_envelope` (0-1, likelihood of new sound).
    *   **Visual:** Simple particle emitter (e.g., a few small spheres that shoot out). Emission rate/velocity/size based on `onset_strength_envelope`.
    *   **Structure:** More complex; would involve managing particle states or using a particle library. For a very simple version, maybe a flashing light: `pointLight.intensity = onset_strength_envelope * 2;` (update in `useFrame`).

---

## Advanced Visualizer: Audio-Driven Deformable Plane

This component visualizes audio frequencies as a dynamic, deformable surface.

**Purpose:** Creates wave-like terrains or abstract undulating surfaces based on the audio's spectral content.

**Suggested Filename:** `DeformablePlane.jsx`

**Props:**
*   `frequency_grid_map` (Array of Numbers, 0-1): A 1D array representing a 2D grid of audio energy/amplitude values. For example, 256 values could represent a 16x16 grid. This data is prepared by the Rust backend.
*   `width` (Number, optional, default: 10): Width of the plane.
*   `height` (Number, optional, default: 10): Height of the plane.
*   `segmentsX` (Number, optional, default: 15): Number of width segments for the plane geometry. More segments allow for more detailed deformation.
*   `segmentsY` (Number, optional, default: 15): Number of height segments.
*   `maxDisplacement` (Number, optional, default: 2): Maximum displacement height for vertices.

**Data Source (Rust Backend):**
*   **Protobuf Field:** `repeated double frequency_grid_map = 45;` in `PrimaryFreq530State`. (Ensure tag number is unique and follows existing scheme).
*   **Rust Logic:**
    1.  Take the raw FFT magnitudes (e.g., 512-1024 bins).
    2.  Define a target `GRID_MAP_SIZE` (e.g., 256 for a 16x16 conceptual grid).
    3.  Map/downsample the FFT magnitudes to this `GRID_MAP_SIZE`. This can be done by averaging chunks of FFT bins or other selection/interpolation methods.
        *   Example: For each of the 256 points in `frequency_grid_map`, average a corresponding slice of the ~512 FFT bins.
    4.  Normalize the resulting `frequency_grid_map` array to a 0-1 range. This makes it easy for the frontend to scale the displacement.

**Visuals & Data Mapping (Frontend R3F):**
*   Uses a `THREE.PlaneGeometry`.
*   In `useFrame`, iterate through the geometry's vertices.
*   For each vertex, calculate its corresponding index/position in the 1D `frequency_grid_map` (which represents a 2D grid). This often involves normalizing the vertex's original X and Y coordinates to map them to the grid dimensions (e.g., if `frequency_grid_map` has 256 values for a 16x16 grid, map vertex X/Y to a 0-15 range for U and V grid coordinates).
*   The value from `frequency_grid_map` at that index determines the vertex's displacement along its Z-axis (or Y-axis if the plane is oriented differently).
*   `geometry.attributes.position.needsUpdate = true;` must be set after modifying positions.
*   `geometry.computeVertexNormals();` should be called to ensure lighting reacts correctly to the deformation.
*   **Performance Note:** For planes with many segments (e.g., > 50x50), direct JavaScript manipulation of vertices can be slow. A custom vertex shader is the recommended approach for high performance, where the `frequency_grid_map` is passed as a texture or uniform array.

**Conceptual Structure:**

```jsx
// Frontend/src/components/audio_visualizers/DeformablePlane.jsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function DeformablePlane({
  frequency_grid_map, // Should be a 1D array, e.g., 256 values for a 16x16 grid
  width = 10,
  height = 10,
  segmentsX = 15, // Results in 16x16 vertices
  segmentsY = 15,
  maxDisplacement = 2,
}) {
  const meshRef = useRef();

  // Memoize geometry to avoid re-creation on every render unless props change
  const geometry = useMemo(() =>
    new THREE.PlaneGeometry(width, height, segmentsX, segmentsY),
    [width, height, segmentsX, segmentsY]
  );

  // Store initial positions to ensure consistent mapping logic
  const initialPositions = useMemo(() => {
      if (geometry) return Float32Array.from(geometry.attributes.position.array);
      return null;
  }, [geometry]);


  useFrame(() => {
    if (!meshRef.current || !frequency_grid_map || !initialPositions || frequency_grid_map.length === 0) {
      // Optionally, set to a flat plane if no data
      if(meshRef.current && meshRef.current.geometry) {
        const positions = meshRef.current.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            positions.setZ(i, 0); // Assuming Z is the displacement axis
        }
        positions.needsUpdate = true;
        meshRef.current.geometry.computeVertexNormals();
      }
      return;
    }

    const positions = meshRef.current.geometry.attributes.position;
    const gridResolution = Math.floor(Math.sqrt(frequency_grid_map.length));

    if (gridResolution * gridResolution !== frequency_grid_map.length && frequency_grid_map.length > 0) {
      console.warn(`frequency_grid_map length (${frequency_grid_map.length}) is not a perfect square. Deformation might be incorrect.`);
      // Consider how to handle this case: flat plane, or attempt partial mapping?
    }

    for (let i = 0; i < positions.count; i++) {
      // Get original X, Y of the vertex (from when the plane was flat)
      const originalX = initialPositions[i * 3];
      const originalY = initialPositions[i * 3 + 1];

      // Normalize original vertex coordinates to 0-1 range
      // Assumes plane is centered at (0,0) before rotation.
      const u = (originalX + width / 2) / width;
      const v = (originalY + height / 2) / height;

      // Map normalized UV to grid indices
      let gridX = Math.floor(u * gridResolution);
      let gridY = Math.floor(v * gridResolution);

      // Clamp indices to be within [0, gridResolution - 1]
      gridX = Math.min(Math.max(0, gridX), gridResolution - 1);
      gridY = Math.min(Math.max(0, gridY), gridResolution - 1);

      let mapIndex = gridY * gridResolution + gridX;
      // Final clamp for the 1D array access
      mapIndex = Math.min(Math.max(0, mapIndex), frequency_grid_map.length - 1);


      const displacementValue = frequency_grid_map[mapIndex] || 0;
      const displacement = displacementValue * maxDisplacement;

      positions.setZ(i, displacement); // Displace along Z-axis (local Z of the plane)
    }

    positions.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}> {/* Rotate to make it horizontal if Y is up in world space */}
      <meshStandardMaterial color="deepskyblue" wireframe={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
```

---

## Integrating New Audio Data in the Frontend

This section outlines how to update your frontend application, specifically the `useFreq530` Zustand store and your React Three Fiber (R3F) components, to consume the new audio data fields like `spectralCentroid`, `chromagram`, `beatPhase`, and `frequencyGridMap`.

### Updating the Zustand Store (`useFreq530`)

To make the new audio data fields available to your R3F components, your `useFreq530` Zustand store needs to be updated. This involves two main parts:

1.  **Augmenting the Store's State Definition:**
    The initial state and the part of your store's state that holds the audio data must be updated to include these new fields. When converting from protobuf field names (snake_case) to JavaScript/TypeScript, it's common practice to use camelCase.

    ```typescript
    // Conceptual representation of your Zustand store's state slice for audio data
    // (Assuming you have types for your state, e.g., AudioDataState)

    // Assuming your state.proto message PrimaryFreq530State translates to an object like this:
    interface PrimaryFreq530StateFromProto {
      time?: number;
      adjustedTime?: number;
      // ... other existing fields in camelCase ...
      // Ensure all fields from your state.proto are represented here in camelCase
      sin?: number;
      cos?: number;
      sinNormal?: number;
      cosNormal?: number;
      adjustedSin?: number;
      adjustedCos?: number;
      adjustedSinNormal?: number;
      adjustedCosNormal?: number;
      low?: number;
      mid?: number;
      high?: number;
      kick?: number;
      snare?: number;
      hihat?: number;
      vocalLikelihood?: number;
      amplitude?: number;
      rawAmplitude?: number;
      beatIntensity?: number;
      bps?: number;
      lowDynamic?: number;
      midDynamic?: number;
      highDynamic?: number;
      kickDynamic?: number;
      snareDynamic?: number;
      hihatDynamic?: number;
      amplitudeDynamic?: number;
      rawAmplitudeDynamic?: number;
      spectralFlux?: number;
      beatTimes?: number[];
      lastBeatTime?: number;
      quantizedBands?: number[]; // Protobuf 'repeated uint32' might become number[]

      // New fields from state.proto
      spectralCentroid?: number;
      spectrogramPng?: Uint8Array; // Protobuf 'optional bytes'
      chromagram?: number[];       // repeated double
      beatPhase?: number;
      frequencyGridMap?: number[]; // repeated double
    }

    // Your Zustand store's state might look something like this:
    type StoreState = {
      isConnected: boolean;
      data: PrimaryFreq530StateFromProto | null; // This 'data' object holds the decoded message
      // ... other store state like methods for connect/disconnect ...
      setData: (decodedData: PrimaryFreq530StateFromProto) => void;
    };

    // Initial state for the 'data' part might be:
    const initialAudioDataState: PrimaryFreq530StateFromProto = {
      time: 0,
      adjustedTime: 0,
      // ... initialize all existing fields ...
      sin: 0, cos: 0, sinNormal: 0, cosNormal: 0, adjustedSin: 0, adjustedCos: 0, adjustedSinNormal: 0, adjustedCosNormal: 0,
      low: 0, mid: 0, high: 0, kick: 0, snare: 0, hihat: 0, vocalLikelihood: 0, amplitude: 0, rawAmplitude: 0,
      beatIntensity: 0, bps: 0,
      lowDynamic: 0, midDynamic: 0, highDynamic: 0, kickDynamic: 0, snareDynamic: 0, hihatDynamic: 0, amplitudeDynamic: 0, rawAmplitudeDynamic: 0,
      spectralFlux: 0,
      beatTimes: [],
      lastBeatTime: 0,
      quantizedBands: Array(32).fill(0), // Example initialization

      // Initialize new fields
      spectralCentroid: 0,
      spectrogramPng: undefined,
      chromagram: Array(12).fill(0), // Example initialization
      beatPhase: 0,
      frequencyGridMap: Array(256).fill(0), // Example initialization, adjust size as needed
    };
    ```

2.  **Updating the WebSocket Message Handler:**
    The part of your store that handles incoming WebSocket messages and decodes the protobuf data needs to correctly extract these new fields from the decoded JavaScript object and update the store's state.

    Zustand's `set` function is used to update the state. Assuming you have a protobuf message object `decodedMessage` after `YourProtoMessageType.decode(new Uint8Array(arrayBuffer))`:

    ```typescript
    // Inside your WebSocket onmessage handler within the Zustand store setup:
    // ws.onmessage = async (event) => {
    //   const arrayBuffer = await (event.data as Blob).arrayBuffer();
    //   // Ensure YourProtoMessageType is the correct type generated from state.proto
    //   const decodedMessage = YourProtoMessageType.decode(new Uint8Array(arrayBuffer));

    //   // Prost-generated JS objects (from Rust) usually have fields in camelCase
    //   // if the proto definition was snake_case.
    //   // If you are using a different JS protobuf library, it might produce an object
    //   // that needs conversion (e.g., YourProtoMessageType.toObject(decodedMessage, {/* options */} ));
    //   // For this example, let's assume decodedMessage directly has the camelCased fields.

    //   set((state) => ({
    //     data: {
    //       // It's often safer to map all fields explicitly if the backend sends complete objects
    //       // or ensure defaults if some fields might be missing.
    //       time: decodedMessage.time || 0,
    //       adjustedTime: decodedMessage.adjustedTime || 0,
    //       sin: decodedMessage.sin || 0,
    //       cos: decodedMessage.cos || 0,
    //       sinNormal: decodedMessage.sinNormal || 0,
    //       cosNormal: decodedMessage.cosNormal || 0,
    //       adjustedSin: decodedMessage.adjustedSin || 0,
    //       adjustedCos: decodedMessage.adjustedCos || 0,
    //       adjustedSinNormal: decodedMessage.adjustedSinNormal || 0,
    //       adjustedCosNormal: decodedMessage.adjustedCosNormal || 0,
    //       low: decodedMessage.low || 0,
    //       mid: decodedMessage.mid || 0,
    //       high: decodedMessage.high || 0,
    //       kick: decodedMessage.kick || 0,
    //       snare: decodedMessage.snare || 0,
    //       hihat: decodedMessage.hihat || 0,
    //       vocalLikelihood: decodedMessage.vocalLikelihood || 0,
    //       amplitude: decodedMessage.amplitude || 0,
    //       rawAmplitude: decodedMessage.rawAmplitude || 0,
    //       beatIntensity: decodedMessage.beatIntensity || 0,
    //       bps: decodedMessage.bps || 0,
    //       lowDynamic: decodedMessage.lowDynamic || 0,
    //       midDynamic: decodedMessage.midDynamic || 0,
    //       highDynamic: decodedMessage.highDynamic || 0,
    //       kickDynamic: decodedMessage.kickDynamic || 0,
    //       snareDynamic: decodedMessage.snareDynamic || 0,
    //       hihatDynamic: decodedMessage.hihatDynamic || 0,
    //       amplitudeDynamic: decodedMessage.amplitudeDynamic || 0,
    //       rawAmplitudeDynamic: decodedMessage.rawAmplitudeDynamic || 0,
    //       spectralFlux: decodedMessage.spectralFlux || 0,
    //       beatTimes: decodedMessage.beatTimes || [],
    //       lastBeatTime: decodedMessage.lastBeatTime || 0,
    //       quantizedBands: decodedMessage.quantizedBands || [],

    //       // Add mapping for new fields:
    //       spectralCentroid: decodedMessage.spectralCentroid || 0,
    //       spectrogramPng: decodedMessage.spectrogramPng || undefined,
    //       chromagram: decodedMessage.chromagram || [],
    //       beatPhase: decodedMessage.beatPhase || 0,
    //       frequencyGridMap: decodedMessage.frequencyGridMap || [],
    //     }
    //   }));
    // };
    ```

**Important Notes for Zustand Implementation:**

*   **Protobuf Code Generation:** The exact field names (camelCase vs snake_case) and types on the `decodedMessage` object depend on your JavaScript/TypeScript protobuf library (e.g., `protoc` with JS plugins, `protobuf.js`, `ts-proto`). Ensure consistency.
*   **Default Values:** Provide sensible defaults for all fields in your store's initial state and when setting data from potentially incomplete messages.
*   **Type Safety:** If using TypeScript, ensure your state types (`PrimaryFreq530StateFromProto`, `StoreState`) are accurate and comprehensive.

### Consuming New Data in Visualizer Components

Once your `useFreq530` Zustand store is updated, your R3F visualizer components will consume this data via props, passed down from a parent component that subscribes to the store.

**Data Flow Review:**

1.  **WebSocket** -> **Zustand Store (`useFreq530`)** (decodes and updates state)
2.  **Parent/Layout Component (e.g., `DemoAudioVisualizersLayout.jsx`)** (subscribes to store, gets `audioData`)
3.  **Props** (parent passes specific data: `audioData.spectralCentroid`, `audioData.frequencyGridMap`, etc.)
4.  **Individual Visualizer Components** (receive data as props)

**Refined `DemoAudioVisualizersLayout.jsx` Example (Conceptual):**

This example shows how `DemoAudioVisualizersLayout` would subscribe to the store and pass the new (and existing) data fields to the respective conceptual components.

```jsx
// Conceptual Frontend/src/components/audio_visualizers/DemoAudioVisualizersLayout.jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
// Ensure this path is correct for your project structure
import { useFreq530 } from '../../stores/useFreq530';

// Import individual visualizer components as previously defined in this document
import AmplitudeVisualizer from './AmplitudeVisualizer';
import BeatIntensityPulsar from './BeatIntensityPulsar';
import FrequencyBandsDisplay from './FrequencyBandsDisplay';
import SpectralCentroidColorShift from './SpectralCentroidColorShift';
import ChromagramVisualizer from './ChromagramVisualizer';
import BeatPhaseAnimator from './BeatPhaseAnimator';
import DeformablePlane from './DeformablePlane';
// ... import other conceptual components if you plan to use them

export default function DemoAudioVisualizersLayout() {
  // Subscribe to the 'data' slice of your Zustand store
  const audioData = useFreq530(state => state.data);

  if (!audioData) {
    // Handle case where data might not be loaded yet or WebSocket is disconnected
    return <div>Loading audio data or WebSocket disconnected...</div>;
  }

  return (
    <Canvas style={{ height: '100vh', width: '100vw' }} camera={{ position: [0, 5, 20], fov: 50 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 7]} intensity={1.5} castShadow />
      <Environment preset="sunset" />
      <OrbitControls />

      {/* Group for existing visualizers - adjust positions as needed */}
      <group position={[0, 0, 0]}>
        <group position={[-9, 0, 0]}><AmplitudeVisualizer amplitude_dynamic={audioData.amplitudeDynamic} /></group>
        <group position={[-6, 0, 0]}><BeatIntensityPulsar beat_intensity={audioData.beatIntensity} last_beat_time={audioData.lastBeatTime} /></group>
        <group position={[-2, -2, 0]}><FrequencyBandsDisplay quantized_bands={audioData.quantizedBands} /></group>
      </group>

      {/* Group for new spectral/harmonic/phase visualizers - adjust positions */}
      <group position={[0, 5, 0]}>
        <group position={[-6, 0, 0]}><SpectralCentroidColorShift spectral_centroid={audioData.spectralCentroid} /></group>
        <group position={[-2, 0, 0]}><ChromagramVisualizer chromagram={audioData.chromagram} /></group>
        <group position={[2, 0, 0]}><BeatPhaseAnimator beat_phase={audioData.beatPhase} /></group>
      </group>

      {/* Deformable Plane - adjust position and props */}
      <group position={[0, -5, -5]}>
        <DeformablePlane
          frequency_grid_map={audioData.frequencyGridMap}
          width={15}
          height={15}
          segmentsX={23} // Example: for a 24x24 vertex grid if map has 576 values
          segmentsY={23}
          maxDisplacement={3}
        />
      </group>

      {/*
        If you implement other suggested features (Spectral Crest, Rolloff, etc.),
        ensure their corresponding fields are added to state.proto, the Rust processor,
        the Zustand store, and then passed as props here. For example:

        // <group position={[/*...*/]}>
        //   <SpectralCrestDefiner spectral_crest={audioData.spectralCrest} />
        // </group>
      */}
    </Canvas>
  );
}
```

**Key Takeaway for Component Consumption:**
The individual visualizer components (`AmplitudeVisualizer`, `DeformablePlane`, etc.) should be designed to be "dumb" regarding data fetching. They receive all necessary audio data via props. The parent component (`DemoAudioVisualizersLayout` in this concept) is responsible for connecting to the Zustand store and passing down the appropriate slices of the `audioData` object. This promotes reusability and separation of concerns.
