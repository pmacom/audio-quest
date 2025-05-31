```markdown
# Conceptual: AmplitudeVisualizer.jsx

## Purpose

This component provides a simple visual representation of the overall dynamic amplitude of the audio. It's useful for getting a quick sense of the music's energy.

## Audio Data Point

*   **`amplitude_dynamic`**: Consumes the `amplitude_dynamic` value from the `useFreq530` store. This value is a normalized (0-1 range) measure of the audio's amplitude, adapted to the song's overall loudness changes.

## Visual Representation

*   A simple 3D cube (`<boxGeometry />`) that uniformly scales its size based on the `amplitude_dynamic` value.
*   A larger cube indicates higher audio energy.

## Conceptual R3F/JSX Structure

```jsx
// Filename: src/components/audio_visualizers/AmplitudeVisualizer.jsx
// (Conceptual structure - requires actual implementation)

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFreq530 } from '../../stores/useFreq530'; // Assuming store path

export function AmplitudeVisualizer(props) {
  const meshRef = useRef();

  // Subscribe to the specific value from the Zustand store
  const amplitude_dynamic = useFreq530(state => state.primaryData?.amplitude_dynamic);

  useFrame(() => {
    if (meshRef.current) {
      const currentAmplitude = amplitude_dynamic || 0; // Default to 0 if undefined
      // Ensure a minimum size and scale up
      const targetScale = 0.2 + currentAmplitude * 1.8;
      // Smoothly interpolate to the target scale for softer visuals (optional)
      meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.1);
    }
  });

  return (
    <mesh ref={meshRef} {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

// Example of how it might be used in a parent component:
// import { AmplitudeVisualizer } from './AmplitudeVisualizer';
// ...
// <AmplitudeVisualizer position={[0, 1, 0]} />
// ...
```

## Props and Data Consumption

*   **Props:** Can accept standard R3F mesh props (e.g., `position`, `rotation`, `scale` for initial base scale) which are spread onto the `<mesh>` element.
*   **Data Store:**
    *   It's assumed that a Zustand store (`useFreq530`) is set up to receive and parse the WebSocket messages from the Rust backend.
    *   The `useFreq530` hook is used to select the `primaryData.amplitude_dynamic` state.
    *   The component re-renders when this specific part of the store updates.

## Notes

*   The `lerp` function in `useFrame` provides simple smoothing for the scaling effect. Adjust the factor (0.1) to control smoothing speed.
*   A default value `(amplitude_dynamic || 0)` is used to prevent errors if the data is momentarily undefined during initialization.
*   The base size of the box is `[1, 1, 1]`. The scaling formula `0.2 + currentAmplitude * 1.8` means the cube will range from 0.2 (silent) to 2.0 (max amplitude) in size.

```
