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
export const Default_FragmentShader = `
uniform vec2 uResolution; // Screen resolution
uniform float uAdjustedAccumulatedTime; // Time for animation
// CRITICAL: Controls main loop count (impact: 9/9)
// VIOLENT: High values may degrade performance or crash browser
uniform float TWEAK_1;
// CRITICAL: Controls inner loop start (impact: 8/9)
// VIOLENT: Low values may cause instability
uniform float TWEAK_2;
// CRITICAL: Controls inner loop end (impact: 8/9)
// VIOLENT: High values may degrade performance
uniform float TWEAK_3;
// CRITICAL: Controls inner loop divisor (impact: 7/9)
// VIOLENT: Low values may cause infinite loop
uniform float TWEAK_4;
// CRITICAL: Time scaling for animation (impact: 6/9)
uniform float TWEAK_5;
// CRITICAL: Position normalization scaling (impact: 5/9)
uniform float TWEAK_6;
// Secondary: Cosine offset scaling (impact: 4/9)
uniform float TWEAK_7;
// Secondary: Output scaling (impact: 3/9)
uniform float TWEAK_8;
// Secondary: Per-channel phase offset (impact: 2/9)
uniform float TWEAK_9;
// Secondary: Output brightness (impact: 1/9)
uniform float TWEAK_10;
varying vec2 vUv;

void main() {
    vec2 r = uResolution;
    vec3 FC = vec3(vUv * r, 0.0);
    float t = uAdjustedAccumulatedTime * TWEAK_5;
    vec3 color = vec3(0.0);
    float mainLoopCount = TWEAK_1 * 80.0; // Main loop count
    float dStart = TWEAK_2 * 1.0;         // Inner loop start
    float dEnd = TWEAK_3 * 9.0;           // Inner loop end
    float dDiv = TWEAK_4 * 0.7;           // Inner loop divisor
    float posNormScale = TWEAK_6 * 2.0;   // Position normalization scaling
    float cosOffset = TWEAK_7 * 0.2;      // Cosine offset scaling
    float outScale = TWEAK_8 * 2000.0;    // Output scaling
    float phaseOffset = TWEAK_9 * 1.0;    // Per-channel phase offset
    float brightness = TWEAK_10 * 1.1;    // Output brightness

    // Per-channel phase/frequency for color richness
    vec3 phase = vec3(1.0, 2.3 + phaseOffset, 3.7 - phaseOffset);
    vec3 freq = vec3(1.0, 1.2, 1.5);

    for(float i = 0.0, z = 0.0, d = 0.0; i < mainLoopCount; i++) {
        vec3 p = z * normalize(FC.rgb * posNormScale - r.xyy);
        p.z -= t;
        p.xy *= mat2(cos(z * cosOffset + vec4(0.0, 11.0, 33.0, 0.0)));
        p.y = abs(p.y);
        for(d = dStart; d < dEnd; d /= dDiv) {
            p += 0.5 * cos(p.yzx * d - t * 0.2) / d;
        }
        z += d = 0.02 + 0.1 * abs(4.0 - p.y);
        // Per-channel color accumulation
        color += (cos(p.y + p.x * 0.1 * freq + phase + vec3(1.0, 3.0, 5.0)) + brightness) / d;
    }
    color = tanh(color / outScale);
    gl_FragColor = vec4(color, 1.0);
}
`;

// Tweak ranges for shader uniforms
// Each range corresponds to a TWEAK_{NUMBER} uniform
const Default_Tweak_Ranges: TweakRanges = [
    // TWEAK_1: Main loop count
    // VIOLENT: High values may degrade performance
    { min: 0.1, max: 1.0, value: 0.5, source: "highDynamic" },
    // TWEAK_2: Inner loop start
    // VIOLENT: Low values may cause instability
    { min: 0.5, max: 2.0, value: 1.0, source: "midDynamic" },
    // TWEAK_3: Inner loop end
    // VIOLENT: High values may degrade performance
    { min: 0.5, max: 2.0, value: 1.0, source: "highDynamic" },
    // TWEAK_4: Inner loop divisor
    // VIOLENT: Low values may cause infinite loop
    { min: 0.1, max: 2.0, value: 1.0, source: "lowDynamic" },
    // TWEAK_5: Time scaling
    { min: 0.1, max: 5.0, value: 1.0, source:"lowDynamic" },
    // TWEAK_6: Position normalization scaling
    { min: 0.5, max: 4.0, value: 1.0, source: "lowDynamic" },
    // TWEAK_7: Cosine offset scaling
    { min: 0.05, max: 1.0, value: 0.2, source: "lowDynamic" },
    // TWEAK_8: Output scaling
    { min: 500.0, max: 4000.0, value: 2000.0, source: "lowDynamic" },
    // TWEAK_9: Per-channel phase offset
    { min: 0.0, max: 2.0, value: 1.0, source: "lowDynamic" },
    // TWEAK_10: Output brightness
    { min: 0.5, max: 2.0, value: 1.1, source: "lowDynamic" },
];

// Default shader settings for the converted shader
export const FREQ530_AMAZING_SHADER_AI_V2: ShaderSettings = {
    shaderId: "amazing-shader-ai-v2",
    isActive: true,
    name: "Amazing AI Shader SOMENAME",
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