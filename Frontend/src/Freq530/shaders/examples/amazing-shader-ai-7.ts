import { ShaderSettings, TweakRanges } from "../../types";

// Default vertex shader for UV mapping and position transformation
export const Default_VertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Default fragment shader with tweakable uniforms
// All violent variables are clamped and commented per glslmaker_v2 rules
export const Default_FragmentShader = `
uniform vec2 uResolution; // Screen resolution
uniform float uAdjustedAccumulatedTime; // Time for animation, ensure it progresses
// CRITICAL: Step size for marching (impact: 9/9)
// VIOLENT: Values <0.01 may cause infinite loops or NaNs
uniform float TWEAK_1;
// CRITICAL: Depth variable, used in denominator (impact: 8/9)
// VIOLENT: Values <0.01 may cause NaNs
uniform float TWEAK_2;
// CRITICAL: Offset for stability (impact: 7/9)
// VIOLENT: Values <0.01 may cause instability
uniform float TWEAK_3;
// CRITICAL: Output divisor (impact: 6/9)
// VIOLENT: Values <10 may cause oversaturation or NaNs
uniform float TWEAK_4;
// CRITICAL: Scaling for step (impact: 5/9)
// VIOLENT: Values <0.05 may cause slow progress
uniform float TWEAK_5;
// CRITICAL: Scaling for cosine (impact: 4/9)
// VIOLENT: Values <0.1 may cause instability
uniform float TWEAK_6;
// CRITICAL: Time scaling (impact: 3/9)
// NOTE: Scaled to avoid unbounded growth
uniform float TWEAK_7;
// Secondary: Offset for depth (impact: 2/9)
// VIOLENT: Values <1 may cause scene collapse
uniform float TWEAK_8;
// Secondary: Offset for z (impact: 1/9)
// VIOLENT: Values <1 may cause scene collapse
uniform float TWEAK_9;
// Secondary: Color offset (impact: 1/9)
// VIOLENT: Values <0.1 may cause dimming
uniform float TWEAK_10;
varying vec2 vUv;

void main() {
  vec2 r = uResolution;
  vec3 FC = vec3(vUv * r, 0.0);
  float t = uAdjustedAccumulatedTime * max(TWEAK_7, 0.01); // Scaled time
  vec4 o = vec4(0.0);
  float i = 0.0, z = 0.0, d = 0.0;
  // Main color accumulation loop
  for(i = 0.0; i < 100.0; i++) {
    // Step and depth, both clamped for safety
    vec3 v, p = z * normalize(FC.rgb * 2.0 - r.xyy);
    p.z += max(TWEAK_9, 1.0); // Offset z
    p.xz *= mat2(cos(0.2 * t + vec4(0.0, 33.0, 11.0, 0.0)));
    v = p;
    // Compute d with clamped offset and scaling
    float minD = max(TWEAK_8, 1.0) + cos(t) - length(p);
    d = 0.2 * max(TWEAK_5, 0.05) * (max(TWEAK_3, 0.01) + abs(dot(cos(p), cos(p / max(TWEAK_6, 0.1)).yzx)) - min(minD, -d * 0.2));
    z += d * max(TWEAK_2, 0.01); // Depth increment, clamped
    // Color accumulation, clamp denominators
    o += (cos(z + t + vec4(0.0, 1.0, max(TWEAK_8, 1.0), 0.0)) + max(TWEAK_10, 0.1)) / max(abs(d * max(TWEAK_1, 0.01) * z), 0.01);
  }
  // Final color normalization and nonlinearity
  o = tanh(o / max(TWEAK_4, 10.0));
  gl_FragColor = o;
}
`;

// Tweak ranges for shader uniforms
// Each range corresponds to a TWEAK_{NUMBER} uniform
// Source must be from Freq530FieldKeys with corresponding Freq530FieldType
const Default_Tweak_Ranges: TweakRanges = [
  // TWEAK_1: Step size, source: low
  // VIOLENT: <0.01 may cause infinite loops
  { min: 0.01, max: 1.0, value: 0.2, source: null },
  // TWEAK_2: Depth, source: amplitude
  // VIOLENT: <0.01 may cause NaNs
  { min: 0.01, max: 2.0, value: 1.0, source: null },
  // TWEAK_3: Offset, source: sinNormal
  // VIOLENT: <0.01 may cause instability
  { min: 0.01, max: 0.1, value: 0.05, source: null },
  // TWEAK_4: Output divisor, source: mid
  // VIOLENT: <10 may cause oversaturation
  { min: 10, max: 1000, value: 400, source: null },
  // TWEAK_5: Scaling, source: high
  // VIOLENT: <0.05 may cause slow progress
  { min: 0.05, max: 1.0, value: 0.2, source: null },
  // TWEAK_6: Cosine scaling, source: kick
  // VIOLENT: <0.1 may cause instability
  { min: 0.1, max: 2.0, value: 0.6, source: null },
  // TWEAK_7: Time scaling, source: adjustedTime
  // NOTE: Scaled to avoid unbounded growth
  { min: 0.01, max: 1.0, value: 0.1, source: null },
  // TWEAK_8: Offset for depth, source: snare
  // VIOLENT: <1 may cause scene collapse
  { min: 1.0, max: 10.0, value: 5.0, source: null },
  // TWEAK_9: Offset for z, source: hihat
  // VIOLENT: <1 may cause scene collapse
  { min: 1.0, max: 20.0, value: 9.0, source: null },
  // TWEAK_10: Color offset, source: spectralFlux
  // VIOLENT: <0.1 may cause dimming
  { min: 0.1, max: 2.0, value: 1.2, source: null },
];

// Default shader settings for the converted shader
export const FREQ530_AMAZING_SHADER_AI_V7: ShaderSettings = {
  shaderId: "amazing-shader-ai-v7",
  isActive: true,
  name: "Amazing AI Shader 7 (GLSLMaker v2)",
  vertexShader: Default_VertexShader,
  fragmentShader: Default_FragmentShader,
  ranges: Default_Tweak_Ranges
};

/**
 * This shader was auto-generated using the glslmaker_v2 rules.
 * Violent and critical variables are clamped and mapped to TWEAK uniforms.
 * Each TWEAK is sourced from a PrimaryFreq530State field for audio-reactive control.
 * See comments for violent thresholds and impact ratings.
 */
