import { ShaderSettings, TweakRanges } from "../types";

// Default vertex shader for UV mapping and position transformation
export const Default_VertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Default fragment shader with tweakable uniforms
export const Default_FragmentShader = `
uniform vec2 uResolution; // Screen resolution
uniform float uAdjustedAccumulatedTime; // Time for animation, ensure it progresses
// CRITICAL: Controls main loop count for color accumulation (impact: 9/9)
// VIOLENT: High values may degrade performance or crash browser
uniform float TWEAK_1;
// CRITICAL: Scales position normalization (impact: 8/9)
uniform float TWEAK_2;
// CRITICAL: Matrix transform scaling (impact: 7/9)
uniform float TWEAK_3;
// CRITICAL: Noise frequency scaling (impact: 7/9)
uniform float TWEAK_4;
// CRITICAL: Time scaling for animation (impact: 7/9)
uniform float TWEAK_5;
// Secondary: Cosine offset scaling (impact: 4/9)
uniform float TWEAK_6;
// CRITICAL: Output scaling for tanh normalization (impact: 6/9)
// VIOLENT: Low values may cause oversaturation or NaNs
uniform float TWEAK_7;
// Secondary: Output nonlinearity (impact: 3/9)
uniform float TWEAK_8;
// Secondary: Unused (safe default) (impact: 1/9)
uniform float TWEAK_9;
// Secondary: Unused (safe default) (impact: 1/9)
uniform float TWEAK_10;
varying vec2 vUv;

// Simplex noise 2D implementation (GLSL)
// Source: https://github.com/ashima/webgl-noise/blob/master/src/noise2D.glsl
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise2D(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  // First corner
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  // Other corners
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 x1 = x0.xy - i1 + C.xx;
  vec2 x2 = x0.xy - 1.0 + 2.0 * C.xx;
  // Permutations
  i = mod289(i);
  vec3 p = permute( permute(
              vec3(i.y + vec3(0.0, i1.y, 1.0)))
            + i.x + vec3(0.0, i1.x, 1.0));
  vec3 x_ = fract(p * C.w) * 2.0 - 1.0;
  vec3 h = abs(x_) - 0.5;
  vec3 ox = floor(x_ + 0.5);
  vec3 a0 = x_ - ox;
  // Normalise gradients
  vec2 g0 = vec2(a0.x, h.x);
  vec2 g1 = vec2(a0.y, h.y);
  vec2 g2 = vec2(a0.z, h.z);
  float t0 = 0.5 - dot(x0,x0);
  float n0 = t0 < 0.0 ? 0.0 : pow(t0,4.0) * dot(g0, x0);
  float t1 = 0.5 - dot(x1,x1);
  float n1 = t1 < 0.0 ? 0.0 : pow(t1,4.0) * dot(g1, x1);
  float t2 = 0.5 - dot(x2,x2);
  float n2 = t2 < 0.0 ? 0.0 : pow(t2,4.0) * dot(g2, x2);
  return 70.0 * (n0 + n1 + n2);
}

void main() {
    vec2 r = uResolution;
    vec3 FC = vec3(vUv * r, 0.0);
    float t = uAdjustedAccumulatedTime * TWEAK_5;
    vec3 color = vec3(0.0);
    float mainLoopCount = TWEAK_1 * 50.0; // Main loop count
    float posNormScale = TWEAK_2 * 1.0;   // Position normalization scaling
    float matScale = TWEAK_3 * 1.0;       // Matrix transform scaling
    float noiseFreq = TWEAK_4 * 7.0;      // Noise frequency scaling
    float cosOffset = TWEAK_6 * 1.0;      // Cosine offset scaling
    float outScale = TWEAK_7 * 100.0;     // Output scaling for tanh
    float nonlinearity = TWEAK_8 * 1.5;   // Output nonlinearity
    // TWEAK_9, TWEAK_10: unused, safe defaults

    // Position normalization and transformation
    vec2 p = (FC.xy - r * 0.5) / r.y;
    p *= mat2(8.0 * matScale, -6.0 * matScale, 6.0 * matScale, 8.0 * matScale);
    vec2 v;
    vec3 phase = vec3(1.0, 2.0, 3.0); // Per-channel phase for color richness
    float f = 3.0 + snoise2D(p + vec2(t * noiseFreq, 0.0));
    for(float i = 0.0; i < mainLoopCount; i++) {
        v = p + cos(i * i + (t + p.x * cosOffset) * 0.03 + i * vec2(11.0, 9.0)) * 5.0;
        // Per-channel color accumulation
        color += (cos(sin(i) * phase) + 1.0) * exp(sin(i * i + t)) / length(max(v, vec2(v.x * f * 0.02, v.y)));
    }
    color = tanh(pow(color / outScale, vec3(nonlinearity)));
    gl_FragColor = vec4(color, 1.0);
}
`;

// Tweak ranges for shader uniforms
// Each range corresponds to a TWEAK_{NUMBER} uniform
const Default_Tweak_Ranges: TweakRanges = [
    // TWEAK_1: Main loop count
    // VIOLENT: High values may degrade performance
    // Source Type: amplitude (Zero1)
    { min: 0.2, max: 1.0, value: 1.0, source: "amplitude" },
    // TWEAK_2: Position normalization scaling
    // Source Type: low (Zero1)
    { min: 0.5, max: 2.0, value: 1.0, source: "low" },
    // TWEAK_3: Matrix transform scaling
    // Source Type: spectralFlux (Zero1)
    { min: 0.5, max: 2.0, value: 1.0, source: "spectralFlux" },
    // TWEAK_4: Noise frequency scaling
    // Source Type: snare (Zero1)
    { min: 0.5, max: 2.0, value: 1.0, source: "snare" },
    // TWEAK_5: Time scaling
    // Source Type: adjustedTime (Number)
    { min: 0.1, max: 5.0, value: 1.0, source: "adjustedTime" },
    // TWEAK_6: Cosine offset scaling
    // Source Type: mid (Zero1)
    { min: 0.5, max: 2.0, value: 1.0, source: "mid" },
    // TWEAK_7: Output scaling for tanh
    // VIOLENT: Low values may cause oversaturation or NaNs
    // Source Type: beatIntensity (Number)
    { min: 10.0, max: 500.0, value: 100.0, source: "beatIntensity" },
    // TWEAK_8: Output nonlinearity
    // Source Type: high (Zero1)
    { min: 0.5, max: 2.0, value: 1.5, source: "high" },
    // TWEAK_9: Unused (safe default)
    // Source Type: kick (Zero1)
    { min: 0.5, max: 1.5, value: 1.0, source: "kick" },
    // TWEAK_10: Unused (safe default)
    // Source Type: vocalLikelihood (Zero1)
    { min: 0.5, max: 1.5, value: 1.0, source: "vocalLikelihood" },
];

// Default shader settings for the converted shader
export const AMAZING_SHADER_AI_3: ShaderSettings = {
    id: "amazing-shader-ai-v3",
    isActive: false,
    name: "Amazing AI Shadeer 3",
    vertexShader: Default_VertexShader,
    fragmentShader: Default_FragmentShader,
    ranges: Default_Tweak_Ranges
};

/**
 * Guidelines for Converting User-Provided GLSL Shader Code
 * 
 * 1. Analyze Intent: Study the GLSL shader to understand its mathematical and visual intent.
 * 2. Identify Critical Variables: Extract variables with significant rendering impact (impact >= 4/9).
 * 3. Handle Violent Variables: Flag variables risking instability (e.g., division by zero) and constrain ranges.
 * 4. Map to TWEAK Uniforms: Assign critical variables to TWEAK_1 through TWEAK_10, scaling by TWEAK values.
 * 5. Set Safe Ranges: Define min, max, and default (1.0) for each TWEAK uniform in Default_Tweak_Ranges.
 * 6. Comment Clearly: Document each TWEAK uniform's purpose, impact, and risks (if violent).
 * 7. Preserve Performance: Avoid excessive loops or computations; test ranges for browser stability.
 * 8. Integrate Code: Insert processed GLSL code into Default_FragmentShader, ensuring compatibility.
 */