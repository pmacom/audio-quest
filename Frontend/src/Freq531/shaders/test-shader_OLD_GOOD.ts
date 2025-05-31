import { ShaderSettings, TweakRanges } from "../types";

export const Default_VertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const Default_FragmentShader = `
uniform vec2 uResolution;
uniform float uAdjustedAccumulatedTime;
uniform float TWEAK_1;
uniform float TWEAK_2;
uniform float TWEAK_3;
uniform float TWEAK_4;
uniform float TWEAK_5;
uniform float TWEAK_6;
uniform float TWEAK_7;
uniform float TWEAK_8;
uniform float TWEAK_9;
uniform float TWEAK_10;
varying vec2 vUv;

void main() {
    vec4 outputColor = vec4(0.0);
    float rayDistance = 0.0;

    // Convert UV to fragment coordinates
    vec3 fragCoord = vec3(vUv * uResolution, 0.0);

    for (float stepCount = 0.0; stepCount < 50.0; stepCount++) {
        float stepSize;

        // Calculate position along the ray
        vec3 position = rayDistance * normalize(fragCoord.rgb * 2.0 - vec3(uResolution.x, uResolution.y, uResolution.y));

        // Shift position along z-axis
        position.z += TWEAK_2 * 6.0;

        // Apply transformation to xz-plane
        float frequency = TWEAK_3 * 0.5;
        position.xz *= mat2(cos(position.y * frequency + vec4(0.0, 33.0, 11.0, 0.0)));

        // Inner loop for position perturbation
        float iterLimit = TWEAK_4 * 9.0;
        float scaleFactor = TWEAK_5 * 0.8;
        for (float freqScale = 1.0; freqScale < iterLimit; freqScale /= scaleFactor) {
            vec3 timeCoeff = vec3(TWEAK_6 * 3.0, 1.0, 0.0);
            vec3 offset = position.yzx - uAdjustedAccumulatedTime * timeCoeff;
            position += cos(offset * freqScale) / freqScale;
        }

        // Compute step size
        float baseStep = TWEAK_7 * 0.01;
        float radius = TWEAK_8 * 0.5;
        float stepScale = TWEAK_9 * 9.0;
        stepSize = baseStep + abs(length(position.xz) - radius) / stepScale;

        // Accumulate color
        float brightness = TWEAK_1 * 1.1;
        outputColor += (sin(rayDistance + vec4(2.0, 3.0, 4.0, 0.0)) + brightness) / stepSize;

        // Advance ray
        rayDistance += stepSize;
    }

    // Apply hyperbolic tangent scaling
    float tanhScale = TWEAK_10 * 1000.0;
    outputColor = tanh(outputColor / tanhScale);

    gl_FragColor = outputColor;
}
`;


const Default_Tweak_Ranges: TweakRanges = [
    { min: 1, max: 1.2, value: 1.1, source: null },
    { min: 0, max: 10, value: 0.5, source: null },
    { min: 0, max: 30, value: 0.5, source: null },
    { min: 0, max: 10, value: 0.5, source: null },  
    { min: 0, max: 10, value: 0.5, source: null },
    
    { min: 0, max: 10, value: 0.5, source: null },
    { min: 0, max: 10, value: 0.5, source: null },
    { min: 0, max: 10, value: 0.5, source: null },
    { min: 0, max: 10, value: 0.5, source: null },
    { min: 0, max: 10, value: 0.5, source: null },
]

export const TEST_SHADER: ShaderSettings = {
    id: "test-shader",
    isActive: false,
    name: "Test Shader",
    vertexShader: Default_VertexShader,
    fragmentShader: Default_FragmentShader,
    ranges: Default_Tweak_Ranges
}