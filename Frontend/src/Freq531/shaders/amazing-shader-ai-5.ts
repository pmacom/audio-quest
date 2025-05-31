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
// Uses uAdjustedAccumulatedTime for time progression to prevent stalls
export const Default_FragmentShader = `
uniform vec2 uResolution; // Screen resolution
uniform float uAdjustedAccumulatedTime; // Time for animation, ensure it progresses
// CRITICAL: Controls main loop count for color accumulation (impact: 9/9)
// VIOLENT: High values may degrade performance or crash browser
uniform float TWEAK_1;
// CRITICAL: Scales position normalization (impact: 8/9)
uniform float TWEAK_2;
// CRITICAL: Z increment per loop (impact: 7/9)
uniform float TWEAK_3;
// CRITICAL: Trig frequency scaling (impact: 7/9)
uniform float TWEAK_4;
// CRITICAL: Time scaling for animation (impact: 7/9)
uniform float TWEAK_5;
// Secondary: Red channel phase offset (impact: 4/9)
uniform float TWEAK_6;
// Secondary: Green channel phase offset (impact: 4/9)
uniform float TWEAK_7;
// Secondary: Blue channel phase offset (impact: 4/9)
uniform float TWEAK_8;
// CRITICAL: Output normalization divisor (impact: 6/9)
// VIOLENT: Low values may cause oversaturation or NaNs
uniform float TWEAK_9;
// Secondary: Output nonlinearity (impact: 3/9)
uniform float TWEAK_10;
varying vec2 vUv;

void main() {
    vec2 r = uResolution;
    vec3 FC = vec3(vUv * r, 0.0);
    float t = uAdjustedAccumulatedTime * TWEAK_5;
    vec3 color = vec3(0.0);
    float mainLoopCount = TWEAK_1 * 100.0; // Main loop count
    float posNormScale = TWEAK_2 * 1.0;    // Position normalization scaling
    float zIncrement = TWEAK_3 * 1.0;      // Z increment per loop
    float trigFreq = TWEAK_4 * 5.0;        // Trig frequency scaling
    float outDivisor = TWEAK_9 * 10000.0;  // Output normalization divisor
    float nonlinearity = TWEAK_10 * 1.0;   // Output nonlinearity
    // Per-channel phase offsets for color richness
    float phaseR = TWEAK_6 * 6.0;
    float phaseG = TWEAK_7 * 2.0;
    float phaseB = TWEAK_8 * 3.0;
    
    // Position normalization and transformation
    vec3 p;
    float z = 0.0;
    float d, l;
    vec3 phase = vec3(phaseR, phaseG, phaseB);
    for(float i = 0.0; i < 100.0; i++) {
        if(i >= mainLoopCount) break;
        // Position calculation
        p = z * (FC.rgb * 2.0 - r.xyy) / r.y * posNormScale;
        p.z += 1.0;
        l = length(p);
        z += zIncrement;
        d = (dot(cos(p / (l * l) * trigFreq + t * trigFreq), sin((p / (l * l) * trigFreq + t * trigFreq).yzx + 0.7)) + 1.8) / 40.0;
        // Per-channel color accumulation
        color += (cos(phase + 9.0 / l + vec3(phaseR, phaseG, phaseB)) + 1.0) / d;
    }
    color = tanh(pow(color / outDivisor, vec3(nonlinearity)));
    gl_FragColor = vec4(color, 1.0);
}
`;

// Tweak ranges for shader uniforms
// Each range corresponds to a TWEAK_{NUMBER} uniform
// Source must be from Freq530FieldKeys with corresponding Freq530FieldType
const Default_Tweak_Ranges: TweakRanges = [
    // TWEAK_1: Main loop count
    // VIOLENT: High values may degrade performance
    // Source Type: amplitude (Zero1)
    { min: 0.2, max: 1.0, value: 1.0, source: "amplitude" },
    // TWEAK_2: Position normalization scaling
    // Source Type: low (Zero1)
    { min: 0.5, max: 2.0, value: 1.0, source: "low" },
    // TWEAK_3: Z increment per loop
    // Source Type: spectralFlux (Zero1)
    { min: 0.5, max: 2.0, value: 1.0, source: "spectralFlux" },
    // TWEAK_4: Trig frequency scaling
    // Source Type: snare (Zero1)
    { min: 0.5, max: 2.0, value: 1.0, source: "snare" },
    // TWEAK_5: Time scaling
    // Source Type: adjustedTime (Number)
    { min: 0.1, max: 5.0, value: 1.0, source: "adjustedTime" },
    // TWEAK_6: Red channel phase offset
    // Source Type: mid (Zero1)
    { min: 0.5, max: 2.0, value: 1.0, source: "mid" },
    // TWEAK_7: Green channel phase offset
    // Source Type: high (Zero1)
    { min: 0.5, max: 2.0, value: 1.0, source: "high" },
    // TWEAK_8: Blue channel phase offset
    // Source Type: kick (Zero1)
    { min: 0.5, max: 2.0, value: 1.0, source: "kick" },
    // TWEAK_9: Output normalization divisor
    // VIOLENT: Low values may cause oversaturation or NaNs
    // Source Type: beatIntensity (Number)
    { min: 1.0, max: 100.0, value: 1.0, source: "beatIntensity" },
    // TWEAK_10: Output nonlinearity
    // Source Type: vocalLikelihood (Zero1)
    { min: 0.5, max: 2.0, value: 1.0, source: "vocalLikelihood" },
];

// Default shader settings for the converted shader
export const AMAZING_SHADER_AI_5: ShaderSettings = {
    id: "amazing-shader-ai-v5",
    isActive: false,
    name: "Amazing AI Shader 5 (Expanded & Colorful)",
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