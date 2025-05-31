---
description: 
globs: 
alwaysApply: true
---
Below is a concise **cursor rule** for creating a reusable React Three Fiber (R3F) GLSL shader template, formatted as Markdown for clarity. The rule emphasizes flexibility for user-defined vertex and fragment shader code, includes specific uniforms (`uTime`, `uDefaultSpeed`, `uSpeedBoost`, `uSpeedBoostMin`, `uSpeedBoostMax`, `uLow`, `uMid`, `uHigh`, `uAmplitude`, `uRawAmplitude`), and provides instructions for their use. The rule is streamlined to fit within 200 lines while maintaining modularity and customization.

---

# Cursor Rule for R3F GLSL Shader Template

This cursor rule provides a formulaic approach to create a reusable React Three Fiber (R3F) GLSL shader template. It supports user-defined vertex and fragment shader code while ensuring consistent uniform handling for dynamic inputs, particularly audio-reactive visuals.

## 1. Project Setup
- **Objective**: Configure a React environment for R3F shaders.
- **Steps**:
  - Use a React project with `@react-three/fiber` and a `ShaderBase` component for `THREE.ShaderMaterial`.
  - Include a state management system (e.g., Zustand) for dynamic inputs like audio data.
  - Add `"use client"` for Next.js client-side rendering if needed.
- **Template**:
  ```tsx
  "use client"
  import ShaderBase from "../ShaderBase"
  import { useAudioStreamStore } from "../hooks/AudioStream/AudioStreamStore"
  ```

## 2. Vertex Shader
- **Objective**: Provide a flexible vertex shader to pass data to the fragment shader.
- **Pattern**:
  - Declare `varying vec2 vUv` for UV coordinates.
  - Compute vertex position using standard matrices.
  - Allow custom GLSL code for additional effects.
- **Template**:
  ```glsl
  varying vec2 vUv;
  [userDefinedVaryings]
  void main() {
    vUv = uv;
    [userDefinedVertexCode]
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  ```
- **Customization**:
  - Add varyings (e.g., `varying vec3 vPosition`) in `[userDefinedVaryings]`.
  - Insert custom vertex logic (e.g., displacement) in `[userDefinedVertexCode]`.

## 3. Fragment Shader
- **Objective**: Create a flexible fragment shader with required uniforms and user-defined effects.
- **Pattern**:
  - Declare uniforms: `uTime`, `uDefaultSpeed`, `uSpeedBoost`, `uSpeedBoostMin`, `uSpeedBoostMax`, `uLow`, `uMid`, `uHigh`, `uAmplitude`, `uRawAmplitude`, `uMirrorValue`.
  - Receive `vUv` and optional user-defined varyings.
  - Initialize output color, add custom effect logic, normalize, and output to `gl_FragColor`.
- **Template**:
  ```glsl
  uniform float uTime;
  uniform float uDefaultSpeed;
  uniform float uSpeedBoost;
  uniform float uSpeedBoostMin;
  uniform float uSpeedBoostMax;
  uniform float uLow;
  uniform float uMid;
  uniform float uHigh;
  uniform float uAmplitude;
  uniform float uRawAmplitude;
  uniform float uMirrorValue;    // Smoothly oscillates between 0-1
  varying vec2 vUv;
  [userDefinedVaryings]

  void main() {
    float adjustedTime = uTime * uDefaultSpeed * (1.0 + clamp(uSpeedBoost, uSpeedBoostMin, uSpeedBoostMax));
    vec4 o = vec4(0.0, 0.0, 0.0, 1.0);
    [userDefinedEffectLogic]
    o = [normalizationFunction](o / [normalizationFactor]);
    gl_FragColor = o;
  }
  ```
- **Customization**:
  - Add varyings in `[userDefinedVaryings]`.
  - Insert custom GLSL (e.g., ray marching, noise) in `[userDefinedEffectLogic]`.
  - Choose `[normalizationFunction]` (e.g., `tanh`, `clamp`) and `[normalizationFactor]` (e.g., `100.0`).

## 4. Component Structure
- **Objective**: Integrate shaders with dynamic uniforms in a React component.
- **Pattern**:
  - Define props for `time`, optional inputs, audio data, and mirror value.
  - Receive audio data and mirror value from the store for smooth animations.
  - Map uniforms to prop values.
  - Pass shaders and uniforms to `ShaderBase`.
- **Template**:
  ```tsx
  interface ShaderProps {
    time: number;
    defaultSpeed?: number;
    speedBoost?: number;
    speedBoostMin?: number;
    speedBoostMax?: number;
    audioData: {
      low: number;
      mid: number;
      high: number;
      amplitude: number;
      rawAmplitude: number;
    };
    mirrorValue: number;  // Add mirror value to props
  }

  export default function CustomShader({ 
    time, 
    defaultSpeed = 1.0, 
    speedBoost = 0.0,
    speedBoostMin = -0.5,
    speedBoostMax = 2.0,
    audioData,
    mirrorValue    // Add mirror value parameter
  }: ShaderProps) {
    const uniforms = {
      uTime: { value: time },
      uDefaultSpeed: { value: defaultSpeed },
      uSpeedBoost: { value: speedBoost },
      uSpeedBoostMin: { value: speedBoostMin },
      uSpeedBoostMax: { value: speedBoostMax },
      uLow: { value: audioData.low },
      uMid: { value: audioData.mid },
      uHigh: { value: audioData.high },
      uAmplitude: { value: audioData.amplitude },
      uRawAmplitude: { value: audioData.rawAmplitude },
      uMirrorValue: { value: mirrorValue }  // Add mirror value uniform
    };

    return (
      <ShaderBase
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    );
  }
  ```
- **Customization**:
  - Add props or uniforms for additional parameters.
  - Extend the `audioData` interface for additional audio metrics.
  - Use `useMemo` for uniform creation if needed for performance optimization.

## 5. Uniforms Instructions
- **Objective**: Define the role and usage of required uniforms.
- **Uniforms**:
  - `uTime` (float): Animation time in seconds, used for time-based effects. Range: 0 to infinity.
  - `uDefaultSpeed` (float): Base speed multiplier for time-based animations. Default: 1.0. Range: 0.0 to infinity.
  - `uSpeedBoost` (float): Additional speed multiplier that can be dynamically adjusted. Default: 0.0.
  - `uSpeedBoostMin` (float): Minimum allowed value for speed boost. Default: -0.5. Prevents animations from going backwards or too slow.
  - `uSpeedBoostMax` (float): Maximum allowed value for speed boost. Default: 2.0. Prevents animations from going too fast.
  - `uLow` (float): Low-frequency audio amplitude (bass). Range: 0.0–1.0. Modulates effects like scale or intensity.
  - `uMid` (float): Mid-frequency audio amplitude. Range: 0.0–1.0. Affects mid-range visual dynamics.
  - `uHigh` (float): High-frequency audio amplitude (treble). Range: 0.0–1.0. Drives high-frequency visuals.
  - `uAmplitude` (float): Overall audio amplitude. Range: 0.0–1.0. Controls general effect strength.
  - `uRawAmplitude` (float): Unprocessed audio amplitude. Range: 0.0–1.0. Used for raw audio-driven effects.
  - `uMirrorValue` (float): Smoothly oscillating value. Range: 0.0–1.0. Perfect for transitions, morphing, and wave effects.
- **Usage**:
  - Map uniforms to audio data from `useAudioStreamStore` in the component.
  - Get mirror value from store: `const mirrorValue = useAudioStreamStore(state => state.easedMirrorValue)`.
  - Use `adjustedTime` in shaders for time-based animations (automatically includes both speed modifiers).
  - Use mirror value for smooth transitions: `mix(value1, value2, uMirrorValue)`.
  - Add custom uniforms (e.g., `uColor`) for additional control.

## 6. Testing
- **Objective**: Ensure template functionality.
- **Steps**:
  - Test with default values (e.g., `uTime = 0`, `uLow = 0.5`, `uMirrorValue = 0.5`).
  - Validate with dynamic audio inputs and mirror oscillation.
  - Optimize performance (e.g., limit iterations in `[userDefinedEffectLogic]`).
- **Requirement**:
  - Include fallback values in the component (e.g., `low = 0.0`, `mirrorValue = 0.0` if store is unavailable).

## 7. Documentation
- **Objective**: Enhance reusability.
- **Pattern**:
  - Comment uniform roles and ranges.
  - Note customization points (e.g., `[userDefinedEffectLogic]`).
- **Example**:
  ```glsl
  // Uniforms for audio-reactive visuals
  uniform float uTime;       // Animation time
  uniform float uLow;        // Low-frequency audio (0.0–1.0)
  uniform float uMirrorValue; // Smooth oscillation (0.0-1.0)
  ```

## 8. Common Mirror Value Use Cases
- **Objective**: Demonstrate effective ways to use the mirror value.
- **Examples**:
  ```glsl
  // Color transitions
  vec3 color1 = vec3(0.8, 0.2, 0.1);
  vec3 color2 = vec3(0.1, 0.2, 0.8);
  vec3 finalColor = mix(color1, color2, uMirrorValue);

  // Oscillating offset
  float mirrorOffset = mix(-1.0, 1.0, uMirrorValue);
  float wave = sin(vUv.x * 10.0 + time + mirrorOffset);

  // Shape morphing
  float radius1 = 0.3;
  float radius2 = 0.8;
  float currentRadius = mix(radius1, radius2, uMirrorValue);
  ```
