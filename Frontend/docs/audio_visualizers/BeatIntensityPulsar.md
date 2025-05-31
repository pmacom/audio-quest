```markdown
# Conceptual: BeatIntensityPulsar.jsx

## Purpose

This component visualizes detected beats in the audio, creating a "pulsing" effect. The intensity of the pulse can correspond to the `beat_intensity` value.

## Audio Data Point

*   **`beat_intensity`**: Consumes the `beat_intensity` value (~0-1) from the `useFreq530` store. This value indicates the strength of the detected beat.
*   **Alternatively (or in combination):** `last_beat_time` can be used to detect a *new* beat event by observing changes in its value.

## Visual Representation

*   A sphere (`<sphereGeometry />`) that quickly scales up and/or increases its emissive intensity upon a beat, then smoothly returns to a base state.
*   The peak scale or emissive brightness during the pulse can be modulated by `beat_intensity`.

## Conceptual R3F/JSX Structure

```jsx
// Filename: src/components/audio_visualizers/BeatIntensityPulsar.jsx
// (Conceptual structure - requires actual implementation, ideally with a spring library)

import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFreq530 } from '../../stores/useFreq530'; // Assuming store path
// For smoother animations, consider a spring library like react-spring/three
// import { useSpring, a } from '@react-spring/three';

export function BeatIntensityPulsar(props) {
  const meshRef = useRef();

  // Subscribe to relevant values from the Zustand store
  const beat_intensity = useFreq530(state => state.primaryData?.beat_intensity);
  const last_beat_time = useFreq530(state => state.primaryData?.last_beat_time);

  const [isPulsing, setIsPulsing] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);
  const [currentIntensity, setCurrentIntensity] = useState(0);

  // Detect new beats by change in last_beat_time
  useEffect(() => {
    if (last_beat_time > 0) { // Ensure last_beat_time is valid
      setIsPulsing(true);
      // Use beat_intensity to determine peak of pulse
      setCurrentScale(1 + (beat_intensity || 0) * 1.5);
      setCurrentIntensity((beat_intensity || 0) * 0.8);
    }
  }, [last_beat_time, beat_intensity]); // Rerun effect if last_beat_time or beat_intensity changes

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isPulsing) {
        // meshRef.current.scale.set(currentScale, currentScale, currentScale); // Instant scale up
        // meshRef.current.material.emissiveIntensity = currentIntensity;
        // After scaling up, start scaling down
        // This is a very basic decay. react-spring would be much better.
        const decayFactor = 5 * delta;
        meshRef.current.scale.lerp({ x: 1, y: 1, z: 1 }, decayFactor);
        meshRef.current.material.emissiveIntensity -= decayFactor * 2; // Faster decay for intensity

        if (meshRef.current.material.emissiveIntensity < 0) meshRef.current.material.emissiveIntensity = 0;

        if (Math.abs(meshRef.current.scale.x - 1) < 0.05) {
          setIsPulsing(false); // Reset pulse state when close to base
          meshRef.current.scale.set(1, 1, 1);
          meshRef.current.material.emissiveIntensity = 0;
        }
      }
       // For continuous pulsing based on beat_intensity without explicit beat event:
       // const targetScale = 1 + (beat_intensity || 0) * 0.5;
       // meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.2);
       // meshRef.current.material.emissiveIntensity = (beat_intensity || 0);
    }
  });

  return (
    <mesh ref={meshRef} {...props} scale={[1,1,1]}> {/* Start at base scale */}
      <sphereGeometry args={[0.7, 32, 32]} />
      <meshStandardMaterial color="purple" emissive="purple" emissiveIntensity={0} />
    </mesh>
  );
}

// Example of use:
// <BeatIntensityPulsar position={[2, 1, 0]} />
```

## Props and Data Consumption

*   **Props:** Standard R3F mesh props.
*   **Data Store:**
    *   Subscribes to `primaryData.beat_intensity` and `primaryData.last_beat_time` from `useFreq530`.
    *   The `useEffect` hook watching `last_beat_time` is a common way to trigger event-like behavior when a specific piece of data updates.

## Notes

*   **Animation:** The conceptual code uses a very basic decay in `useFrame`. For a much smoother and more controllable pulse effect, integrating a spring animation library like `react-spring` (using its `@react-spring/three` bindings) is highly recommended. You would define a spring that animates the scale and emissive intensity.
*   **Alternative Trigger:** Instead of `useEffect` on `last_beat_time`, you could analyze `beat_intensity` directly in `useFrame`. If it exceeds a threshold and wasn't above it in the previous frame, trigger a pulse.
*   **Emissive Color:** The `emissive` and `emissiveIntensity` properties on `meshStandardMaterial` make the object appear to glow.
*   The example shows a scale pulse. You could also (or instead) pulse the `emissiveIntensity`.

```
