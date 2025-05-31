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
uniform float uAdjustedAccumulatedTime; // Time for animation
// CRITICAL: Controls main loop count (impact: 9/9)
// VIOLENT: High values may degrade performance or crash browser
uniform float TWEAK_1;
// CRITICAL: Controls inner loop max (impact: 8/9)
// VIOLENT: High values may degrade performance or cause instability
uniform float TWEAK_2;
// CRITICAL: Time scaling for animation (impact: 7/9)
uniform float TWEAK_3;
// CRITICAL: Ray direction Z (impact: 6/9)
uniform float TWEAK_4;
// CRITICAL: Ray direction offset X (impact: 5/9)
uniform float TWEAK_5;
// Secondary: HSV hue scaling (impact: 4/9)
uniform float TWEAK_6;
// Secondary: HSV saturation scaling (impact: 3/9)
uniform float TWEAK_7;
// Secondary: HSV value scaling (impact: 2/9)
uniform float TWEAK_8;
// Secondary: Log/exp/atan scaling (impact: 2/9)
uniform float TWEAK_9;
// Secondary: Output brightness (impact: 1/9)
uniform float TWEAK_10;
varying vec2 vUv;

// HSV to RGB conversion helper
vec3 hsv(float h, float s, float v) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return v * mix(vec3(1.0), rgb, s);
}

void main() {
    vec2 r = uResolution;
    vec3 FC = vec3(vUv * r, 0.0);
    float t = uAdjustedAccumulatedTime * TWEAK_3;
    float o = 0.0;
    vec3 color = vec3(0.0);
    float mainLoopCount = TWEAK_1 * 99.0; // Main loop count
    float innerLoopMax = TWEAK_2 * 300.0; // Inner loop max
    float rayZ = TWEAK_4 * 0.8;           // Ray direction Z
    float rayOffsetX = TWEAK_5 * 0.5;     // Ray direction offset X
    float hsvHueScale = TWEAK_6 * 0.1;    // HSV hue scaling
    float hsvSatScale = TWEAK_7 * 0.15;   // HSV saturation scaling
    float hsvValScale = TWEAK_8 * 0.7;    // HSV value scaling
    float logExpAtanScale = TWEAK_9 * 0.8; // Log/exp/atan scaling
    float outBrightness = TWEAK_10 * 35.0; // Output brightness

    float i = 0.0, e = 0.0, R = 0.0, s = 0.0;
    vec3 q = vec3(0.0);
    vec3 d = vec3(FC.xy / r - vec2(rayOffsetX, -0.3), rayZ);
    q.zy -= 1.0;
    for(i = 0.0; i < mainLoopCount; i++) {
        // Color accumulation using HSV
        color += hsv(hsvHueScale, hsvSatScale, min(e * s, hsvValScale) / outBrightness);
        s = 1.0;
        vec3 p = q + d * e * R * 0.2;
        p = vec3(
            log(R = length(p)) - t * logExpAtanScale,
            exp(logExpAtanScale - p.z / R),
            atan(p.y, p.x) + t * 0.4
        );
        for(e = --p.y, s = 1.0; s < innerLoopMax; s += s) {
            e += dot(sin(p.yzz * s) - 0.5, 0.8 - sin(p.zxx * s)) / s * 0.3;
        }
        q += d * e * R * 0.2;
    }
    gl_FragColor = vec4(color, 1.0);
}
`;

// Tweak ranges for shader uniforms
// Each range corresponds to a TWEAK_{NUMBER} uniform
const Default_Tweak_Ranges: TweakRanges = [
    // TWEAK_1: Main loop count
    // VIOLENT: High values may degrade performance
    { min: 0.1, max: 1.0, value: 0.5, source: "main_loop_count" },
    // TWEAK_2: Inner loop max
    // VIOLENT: High values may degrade performance or cause instability
    { min: 0.1, max: 1.0, value: 1.0, source: "inner_loop_max" },
    // TWEAK_3: Time scaling
    { min: 0.1, max: 5.0, value: 1.0, source: "time_scale" },
    // TWEAK_4: Ray direction Z
    { min: 0.1, max: 2.0, value: 1.0, source: "ray_z" },
    // TWEAK_5: Ray direction offset X
    { min: 0.0, max: 1.0, value: 1.0, source: "ray_offset_x" },
    // TWEAK_6: HSV hue scaling
    { min: 0.05, max: 0.5, value: 0.1, source: "hsv_hue_scale" },
    // TWEAK_7: HSV saturation scaling
    { min: 0.05, max: 0.5, value: 0.15, source: "hsv_sat_scale" },
    // TWEAK_8: HSV value scaling
    { min: 0.1, max: 1.5, value: 0.7, source: "hsv_val_scale" },
    // TWEAK_9: Log/exp/atan scaling
    { min: 0.1, max: 2.0, value: 0.8, source: "logexpatan_scale" },
    // TWEAK_10: Output brightness
    { min: 10.0, max: 100.0, value: 35.0, source: "brightness" },
];

// Default shader settings for the converted shader
export const AMAZING_SHADER_AI: ShaderSettings = {
    id: "amazing-shader-ai-v1",
    isActive: false,
    name: "Amazing AI Shader (HSV Tweak)",
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