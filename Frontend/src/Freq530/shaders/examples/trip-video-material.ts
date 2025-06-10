import { ShaderSettings, TweakRanges } from "../../types";

// Standard vertex shader for UV mapping and position transformation
export const TripVideo_VertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment shader adapted from TripVideoPlane for use with CachedShader
// This processes video textures and masks with audio-reactive properties
export const TripVideo_FragmentShader = `
uniform vec2 uResolution; // Screen resolution
uniform float uAdjustedAccumulatedTime; // Time for animation

// CRITICAL: Video A texture influence (impact: 9/9)
// Controls the strength of the primary video texture
uniform float TWEAK_1;

// CRITICAL: Video B texture influence (impact: 8/9) 
// Controls the strength of the secondary video texture
uniform float TWEAK_2;

// CRITICAL: Mask A influence (impact: 7/9)
// Controls how strongly mask A affects the final output
uniform float TWEAK_3;

// CRITICAL: Mask B influence (impact: 6/9)
// Controls how strongly mask B affects the final output
uniform float TWEAK_4;

// CRITICAL: Video transition factor (impact: 8/9)
// Controls blending between video A and video B
uniform float TWEAK_5;

// CRITICAL: Mask transition factor (impact: 7/9)
// Controls blending between mask A and mask B
uniform float TWEAK_6;

// Secondary: Color saturation multiplier (impact: 4/9)
uniform float TWEAK_7;

// Secondary: Brightness/contrast adjustment (impact: 3/9)
uniform float TWEAK_8;

// Secondary: UV scale distortion (impact: 2/9)
uniform float TWEAK_9;

// Secondary: Time-based UV offset (impact: 1/9)
uniform float TWEAK_10;

varying vec2 vUv;

// Procedural video simulation - creates animated patterns that mimic video content
vec3 generateProceduralVideo(vec2 uv, float time, float style) {
    // Create base pattern using style parameter
    vec2 p = uv * (2.0 + style * 3.0);
    
    // Animated waves
    float wave1 = sin(p.x * 3.0 + time * 2.0) * 0.5 + 0.5;
    float wave2 = sin(p.y * 4.0 + time * 1.5) * 0.5 + 0.5;
    float wave3 = sin((p.x + p.y) * 2.0 + time * 3.0) * 0.5 + 0.5;
    
    // Color modulation based on position and time
    vec3 color1 = vec3(wave1, wave2 * 0.8, wave3 * 0.6);
    vec3 color2 = vec3(0.2 + wave3 * 0.3, 0.5 + wave1 * 0.4, 0.8 + wave2 * 0.2);
    
    // Mix colors based on animated pattern
    float mixer = sin(length(p) * 2.0 - time) * 0.5 + 0.5;
    return mix(color1, color2, mixer * style);
}

// Procedural mask generation
float generateProceduralMask(vec2 uv, float time, float style) {
    vec2 center = vec2(0.5);
    float dist = length(uv - center);
    
    // Animated circular patterns
    float mask = sin(dist * 8.0 - time * 2.0 + style * 3.14159) * 0.5 + 0.5;
    
    // Add some noise for organic feel
    mask += sin(uv.x * 20.0 + time) * sin(uv.y * 15.0 + time * 1.3) * 0.1;
    
    return clamp(mask, 0.0, 1.0);
}

void main() {
    // Apply UV transformations
    vec2 scaledUV = vUv * TWEAK_9;
    vec2 timeOffset = vec2(sin(uAdjustedAccumulatedTime * 0.5), cos(uAdjustedAccumulatedTime * 0.3)) * TWEAK_10 * 0.1;
    vec2 finalUV = scaledUV + timeOffset;
    
    // Generate procedural video content
    vec3 videoA = generateProceduralVideo(finalUV, uAdjustedAccumulatedTime, TWEAK_1);
    vec3 videoB = generateProceduralVideo(finalUV * 1.3, uAdjustedAccumulatedTime * 0.8, TWEAK_2);
    
    // Generate procedural masks
    float maskA = generateProceduralMask(finalUV, uAdjustedAccumulatedTime, TWEAK_3);
    float maskB = generateProceduralMask(finalUV * 0.7, uAdjustedAccumulatedTime * 1.2, TWEAK_4);
    
    // Blend videos based on transition factor
    vec3 blendedVideo = mix(videoA, videoB, TWEAK_5);
    
    // Blend masks based on transition factor
    float blendedMask = mix(maskA, maskB, TWEAK_6);
    
    // Apply mask to video
    vec3 maskedVideo = blendedVideo * blendedMask;
    
    // Apply color adjustments
    maskedVideo = mix(maskedVideo, maskedVideo * maskedVideo, TWEAK_7 - 1.0); // Saturation
    maskedVideo *= TWEAK_8; // Brightness
    
    // Add some ambient color to prevent pure black
    maskedVideo += vec3(0.02, 0.01, 0.03) * (1.0 - blendedMask);
    
    gl_FragColor = vec4(maskedVideo, 1.0);
}
`;

// Tweak ranges for shader uniforms mapped to audio-reactive values
const TripVideo_Tweak_Ranges: TweakRanges = [
    // TWEAK_1: Video A texture influence
    // Source: amplitude - stronger audio creates more intense video A patterns
    // Fallback: uses default value when audio is not available
    { min: 0.1, max: 3.0, value: 1.5, source: "amplitude" },
    
    // TWEAK_2: Video B texture influence  
    // Source: beatIntensity - beat intensity affects video B patterns
    // Fallback: uses default value when audio is not available
    { min: 0.1, max: 3.0, value: 1.2, source: "beatIntensity" },
    
    // TWEAK_3: Mask A influence
    // Source: low - bass frequencies control mask A strength
    // Fallback: uses default value when audio is not available
    { min: 0.0, max: 2.0, value: 1.0, source: "low" },
    
    // TWEAK_4: Mask B influence
    // Source: high - treble frequencies control mask B strength
    // Fallback: uses default value when audio is not available
    { min: 0.0, max: 2.0, value: 0.8, source: "high" },
    
    // TWEAK_5: Video transition factor
    // Source: mid - mid frequencies control video blending
    // Fallback: uses default value when audio is not available
    { min: 0.0, max: 1.0, value: 0.6, source: "mid" },
    
    // TWEAK_6: Mask transition factor
    // Source: kick - kick drum controls mask blending
    // Fallback: uses default value when audio is not available
    { min: 0.0, max: 1.0, value: 0.4, source: "kick" },
    
    // TWEAK_7: Color saturation multiplier
    // Source: snare - snare hits affect color saturation
    // Fallback: uses default value when audio is not available
    { min: 0.0, max: 3.0, value: 1.8, source: "snare" },
    
    // TWEAK_8: Brightness/contrast adjustment
    // Source: hihat - hi-hat affects brightness
    // Fallback: uses default value when audio is not available
    { min: 0.5, max: 3.0, value: 1.4, source: "hihat" },
    
    // TWEAK_9: UV scale distortion
    // Source: spectralFlux - spectral changes affect UV scaling
    // Fallback: uses default value when audio is not available
    { min: 0.5, max: 3.0, value: 1.1, source: "spectralFlux" },
    
    // TWEAK_10: Time-based UV offset
    // Source: rawAmplitude - raw audio level affects time-based movement
    // Fallback: uses default value when audio is not available
    { min: 0.0, max: 1.0, value: 0.5, source: "rawAmplitude" },
];

// Shader settings for the trip video material
export const TRIP_VIDEO_MATERIAL_SHADER: ShaderSettings = {
    shaderId: "trip-video-material",
    isActive: true,
    name: "Trip Video Material",
    vertexShader: TripVideo_VertexShader,
    fragmentShader: TripVideo_FragmentShader,
    ranges: TripVideo_Tweak_Ranges
};

/**
 * Trip Video Material Shader
 * 
 * This shader creates audio-reactive video-like patterns that can be applied to any 3D model.
 * It generates procedural video content and masks that respond to audio frequencies,
 * providing the visual essence of the TripVideoPlane but optimized for 3D model surfaces.
 * 
 * Key Features:
 * - Procedural video generation (no actual video files needed)
 * - Audio-reactive mask blending
 * - Dynamic color saturation and brightness
 * - Time-based UV animations
 * - Fully compatible with CachedShader system
 * 
 * Usage: Apply to any 3D model using the TrippyMaterialProvider component
 */ 