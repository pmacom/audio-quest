import * as THREE from 'three';

const VideoFadeShader = {
  uniforms: {
    textureA: { value: null },
    textureB: { value: null },
    maskA: { value: null },
    maskB: { value: null },
    videoMix: { value: 0.0 },
    maskMix: { value: 0.0 },
    opacity: { value: 1.0 }, // Added opacity uniform
    minLuminance: { value: 0.0 },
    useMasks: { value: true },
    fadeAmount: { value: 0.2 },
    textureA_aspectRatio: { value: new THREE.Vector2(1, 1) },
    textureB_aspectRatio: { value: new THREE.Vector2(1, 1) },
    factorTest: { value: 0.3 },
    debugMode: { value: true },
    uvScale: { value: 1.0 },
    maskContrast: { value: 1.0 }, // Uniform for adjusting mask contrast
    maskBrightness: { value: 1.0 }, // Brightness adjustment
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform sampler2D maskA;
    uniform sampler2D maskB;
    uniform float videoMix;
    uniform float maskMix;
    uniform float opacity; // Added opacity uniform
    uniform float minLuminance;
    uniform bool useMasks;
    uniform float fadeAmount;
    uniform float factorTest;
    uniform vec2 textureA_aspectRatio;
    uniform vec2 textureB_aspectRatio;
    uniform bool debugMode;
    uniform float uvScale;
    uniform float maskContrast;  // Uniform for adjusting mask contrast
    uniform float maskBrightness;  // Brightness adjustment

    varying vec2 vUv;
    varying vec3 vPosition;

    vec2 calculateContainUV(vec2 uv, vec2 aspectRatio) {
      vec2 scaledUV = uv;
      float textureRatio = aspectRatio.x / aspectRatio.y;
      float screenRatio = 1.0;

      if (textureRatio > screenRatio) {
        scaledUV.y = (uv.y - 0.5) * screenRatio / textureRatio + 0.5;
      } else {
        scaledUV.x = (uv.x - 0.5) * textureRatio / screenRatio + 0.5;
      }
      return scaledUV;
    }

    vec3 applyContrast(vec3 color, float contrast) {
      return (color - 0.5) * contrast + 0.5;
    }

    vec3 applyBrightness(vec3 color, float brightness) {
      return color * brightness;
    }

    void main() {
      // Calculate UVs for textureA and textureB based on "contain" logic
      vec2 uvA = calculateContainUV(vUv, textureA_aspectRatio);
      vec2 uvB = calculateContainUV(vUv, textureB_aspectRatio);

      vec2 finalUV = mix(uvA, uvB, videoMix);

      // Scale UVs around the center (0.5, 0.5)
      finalUV = (finalUV - 0.5) * uvScale + 0.5;

      // Ripple effect, considering the spherical distortion
      float distFromCenter = distance(finalUV, vec2(0.5, 0.5));
      float ripple = sin(distFromCenter * factorTest * 10.0) * 0.02;
      finalUV += normalize(finalUV - vec2(0.5, 0.5)) * ripple;

      // Sample textures
      vec4 videoColorA = texture2D(textureA, finalUV);
      vec4 videoColorB = texture2D(textureB, finalUV);
      vec4 blendedVideo = mix(videoColorA, videoColorB, videoMix);

      // Handle masks using the same UVs as video textures
      float maskLuminance = 1.0;
      float maskAlpha = 1.0;

      if (true) {
        vec4 maskColorA = texture2D(maskA, finalUV);
        vec4 maskColorB = texture2D(maskB, finalUV);
        vec4 blendedMask = mix(maskColorA, maskColorB, maskMix);

        // Apply contrast adjustment to the mask
        blendedMask.rgb = applyContrast(blendedMask.rgb, maskContrast);
        blendedMask.rgb = applyBrightness(blendedMask.rgb, maskBrightness);

        maskLuminance = dot(blendedMask.rgb, vec3(0.299, 0.587, 0.114));
        maskAlpha = blendedMask.a;
        maskLuminance = max(maskLuminance, minLuminance);
      }

      // Apply fade factor, adjusted for spherical projection
      float fadeFactor = 1.0 - smoothstep(fadeAmount, 0.5, distFromCenter);
      float finalAlpha = fadeFactor * opacity * maskAlpha; // Use opacity in final alpha calculation

      if (debugMode) {
        finalAlpha = max(finalAlpha, 0.2);
      }

      gl_FragColor = vec4(blendedVideo.rgb * maskLuminance, finalAlpha);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
};

export default VideoFadeShader;
