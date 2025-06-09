import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { animated } from '@react-spring/three';
import VideoFadeShader from './VideoFadeShader';
import { useControls } from 'leva';
import { useFreq530 } from '../audio/store/useFreq530';
import { useVideoTexturesOptimized } from '../hooks/useVideoTextureOptimized';
import { gsap } from 'gsap';

interface TripVideoPlaneProps {
  videoA: string;
  videoB: string;
  maskA: string;
  maskB: string;
  bounceVideoA?: boolean;
  bounceVideoB?: boolean;
  bounceMaskA?: boolean;
  bounceMaskB?: boolean;
  videoDirection: number; // Value between 0 and 1 for transitioning between videos
  maskDirection: number;  // Value between 0 and 1 for transitioning between masks
  // Video ratio information for scale animation - should be [width, height] arrays
  videoARatio?: [number, number]; // [width, height] of video A
  videoBRatio?: [number, number]; // [width, height] of video B
  // Transition duration for scale animation timing
  videoTransitionDuration?: number;
  // 🎵 Speed settings for amplitude-based video control
  videoASpeedMin?: number;
  videoASpeedMax?: number;
  videoBSpeedMin?: number;
  videoBSpeedMax?: number;
  // Legacy speed props (deprecated but kept for compatibility)
  videoASpeed?: number;
  videoBSpeed?: number;
}

// Enable dynamic scaling based on video ratios
const ENABLE_DYNAMIC_SCALING = true;

const TripVideoPlane = ({
  videoA,
  videoB,
  maskA,
  maskB,
  bounceVideoA,
  bounceVideoB,
  bounceMaskA,
  bounceMaskB,
  videoDirection,
  maskDirection,
  videoARatio,
  videoBRatio,
  videoTransitionDuration,
  videoASpeedMin,
  videoASpeedMax,
  videoBSpeedMin,
  videoBSpeedMax,
  videoASpeed,
  videoBSpeed,
}: TripVideoPlaneProps) => {
  const amplitude = useFreq530(state => state.values.amplitude)
  const planeRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  // Store aspect ratio values so we can smoothly transition when sources change
  const videoAspectA = useRef(1);
  const videoAspectB = useRef(1);
  // Track previous ratio to detect changes
  const prevVideoARatio = useRef<[number, number] | undefined>(undefined);
  const prevVideoBRatio = useRef<[number, number] | undefined>(undefined);

  // ✨ AMPLITUDE-BASED SPEED CONTROL ✨
  // Calculate video playback speeds based on normalized amplitude (0-1) and video speed settings
  
  // Default speed ranges if not provided
  const defaultSpeedMin = 0.3;
  const defaultSpeedMax = 1.5;
  
  // Extract speed settings from VideoSequencer props or use defaults
  const videoASpeedMinActual = videoASpeedMin || defaultSpeedMin;
  const videoASpeedMaxActual = videoASpeedMax || defaultSpeedMax; // Note: using videoASpeedMax as max if available
  const videoBSpeedMinActual = videoBSpeedMin || defaultSpeedMin;
  const videoBSpeedMaxActual = videoBSpeedMax || defaultSpeedMax; // Note: using videoASpeedMax as max if available
  
  // Calculate amplitude-based speeds: speed = speedMin + (amplitude * (speedMax - speedMin))
  const videoARate = videoASpeedMinActual + (amplitude * (videoASpeedMaxActual - videoASpeedMinActual));
  const videoBRate = videoBSpeedMinActual + (amplitude * (videoBSpeedMaxActual - videoBSpeedMinActual));
  
  // Use a blended rate based on video direction for masks
  const blendedVideoRate = videoARate * (1 - videoDirection) + videoBRate * videoDirection;
  const maskRate = blendedVideoRate; // Sync masks with video speed
  
  // Add Leva controls for testing and tweaking
  const { enableAmplitudeSpeed, speedMultiplier, logAmplitude } = useControls('Amplitude Speed Control', {
    enableAmplitudeSpeed: { value: true, label: 'Enable Amplitude Speed' },
    speedMultiplier: { value: 1.0, min: 0.1, max: 3.0, step: 0.1, label: 'Speed Multiplier' },
    logAmplitude: { value: false, label: 'Log Amplitude Values' },
  });
  
  // Apply speed multiplier and enable/disable toggle
  const finalVideoARate = enableAmplitudeSpeed ? videoARate * speedMultiplier : 1.0;
  const finalVideoBRate = enableAmplitudeSpeed ? videoBRate * speedMultiplier : 1.0;
  const finalMaskRate = enableAmplitudeSpeed ? maskRate * speedMultiplier : 1.0;
  
  // Optional logging for debugging
  if (logAmplitude) {
    console.log('🎵 Amplitude Speed Control:', {
      amplitude: amplitude.toFixed(3),
      speedRanges: {
        videoA: `${videoASpeedMinActual.toFixed(2)}-${videoASpeedMaxActual.toFixed(2)}`,
        videoB: `${videoBSpeedMinActual.toFixed(2)}-${videoBSpeedMaxActual.toFixed(2)}`
      },
      rawSpeedProps: {
        videoASpeedMin,
        videoASpeedMax,
        videoBSpeedMin, 
        videoBSpeedMax
      },
      calculatedSpeeds: {
        videoARate: finalVideoARate.toFixed(3),
        videoBRate: finalVideoBRate.toFixed(3),
        maskRate: finalMaskRate.toFixed(3)
      },
      videoDirection: videoDirection.toFixed(3),
      speedMultiplier: speedMultiplier.toFixed(2),
      enabled: enableAmplitudeSpeed
    });
  }
  
  const {
    textures: [videoTextureA, videoTextureB],
    videos: [videoElementA, videoElementB],
  } = useVideoTexturesOptimized(
    [
      { urls: [videoA] },
      { urls: [videoB] },
    ],
    [finalVideoARate, finalVideoBRate], // 🎵 Now using individual rates for each video!
    // Pass blend states for conditional optimization
    [1 - videoDirection, videoDirection] // videoA visibility, videoB visibility
  )

  const {
    textures: [maskTextureA, maskTextureB],
    videos: [maskElementA, maskElementB],
  } = useVideoTexturesOptimized([
    { urls: [maskA] },
    { urls: [maskB] },
  ], [finalMaskRate, finalMaskRate], // 🎵 Both masks use the same blended rate
  // Pass mask blend states for conditional optimization
  [1 - maskDirection, maskDirection] // maskA visibility, maskB visibility
  )

  const { factorTest } = useControls('TripVideoPlane', {
    factorTest: { value: 0.3, min: 0, max: 1 },
  });

  useEffect(() => {
    if (
      materialRef.current &&
      videoTextureA &&
      videoTextureB &&
      maskTextureA &&
      maskTextureB
    ) {
      materialRef.current.uniforms.textureA.value = videoTextureA;
      materialRef.current.uniforms.textureB.value = videoTextureB;
      materialRef.current.uniforms.maskA.value = maskTextureA;
      materialRef.current.uniforms.maskB.value = maskTextureB;
      materialRef.current.uniforms.amplitude.value = amplitude;
    //  updateMaterialAspectRatios();
    }
  }, [videoTextureA, videoTextureB, maskTextureA, maskTextureB, amplitude]);

  // Helper function to convert [width, height] ratio to scale values
  const calculateScaleFromRatio = (ratio: [number, number]): [number, number] => {
    if (!ratio || ratio.length !== 2 || ratio[0] <= 0 || ratio[1] <= 0) {
      return [1, 1] as [number, number]; // Default scale if invalid ratio
    }
    
    const [width, height] = ratio;
    const aspectRatio = width / height;
    
    // For a sphere/plane, we typically want to scale based on aspect ratio
    // If aspect ratio > 1 (wider), scale Y down to maintain proportion
    // If aspect ratio < 1 (taller), scale X down to maintain proportion
    if (aspectRatio > 1) {
      return [1, 1 / aspectRatio] as [number, number]; // Wide content: reduce height
    } else {
      return [aspectRatio, 1] as [number, number]; // Tall content: reduce width
    }
  };

  // Animate scale when video ratios change
  useEffect(() => {
    if (!planeRef.current) return;
    
    // Check if ratios have changed
    const ratioAChanged = JSON.stringify(videoARatio) !== JSON.stringify(prevVideoARatio.current);
    const ratioBChanged = JSON.stringify(videoBRatio) !== JSON.stringify(prevVideoBRatio.current);
    
    if (ratioAChanged || ratioBChanged) {
      console.log('Video ratio changed, animating scale:', { 
        videoARatio, 
        videoBRatio, 
        videoDirection: videoDirection.toFixed(3) 
      });
      
             // Calculate scale values from [width, height] ratios
       const scaleA = videoARatio ? calculateScaleFromRatio(videoARatio) : [1, 1] as [number, number];
       const scaleB = videoBRatio ? calculateScaleFromRatio(videoBRatio) : [1, 1] as [number, number];
      
      // Calculate target scale based on current video direction
      let targetScale: [number, number];
      
      if (videoDirection <= 0.5 && videoARatio) {
        // Primarily showing video A
        targetScale = scaleA;
      } else if (videoDirection > 0.5 && videoBRatio) {
        // Primarily showing video B  
        targetScale = scaleB;
      } else if (videoARatio && videoBRatio) {
        // Interpolate between the two scales based on video direction
        const t = videoDirection;
        targetScale = [
          scaleA[0] * (1 - t) + scaleB[0] * t,
          scaleA[1] * (1 - t) + scaleB[1] * t
        ] as [number, number];
      } else {
        targetScale = [1, 1] as [number, number]; // Fallback to default scale
      }
      
      console.log('Ratio to Scale conversion:', {
        videoARatio,
        videoBRatio,
        scaleA,
        scaleB,
        targetScale,
        videoDirection: videoDirection.toFixed(3)
      });
      
      // Animate scale with GSAP (use duration if provided, otherwise instant)
      const duration = videoTransitionDuration || 0;
      
      if (duration > 0) {
        gsap.to(planeRef.current.scale, {
          x: targetScale[0],
          y: targetScale[1],
          z: 1,
          duration: duration,
          ease: "power2.out",
          overwrite: true,
          onComplete: () => {
            console.log('Scale animation completed to:', targetScale);
          }
        });
      } else {
        // Instant update if no duration
        planeRef.current.scale.set(targetScale[0], targetScale[1], 1);
        console.log('Scale updated instantly to:', targetScale);
      }
      
      // Update previous ratios
      prevVideoARatio.current = videoARatio;
      prevVideoBRatio.current = videoBRatio;
    }
  }, [videoARatio, videoBRatio, videoDirection, videoTransitionDuration]);

  const shaderMaterial = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        textureA: { value: videoTextureA },
        textureB: { value: videoTextureB },
        maskA: { value: maskTextureA },
        maskB: { value: maskTextureB },
        amplitude: { value: amplitude },
        videoMix: { value: videoDirection },
        maskMix: { value: maskDirection },
        opacity: { value: 1.0 },
        factorTest: { value: 0.4 },
        textureA_aspectRatio: { value: new THREE.Vector2(1, 1) },
        textureB_aspectRatio: { value: new THREE.Vector2(1, 1) },
        uvScale: { value: 1.0 },
        maskContrast: { value: 1.0 },
        maskBrightness: { value: 1.0 },
      },
      vertexShader: VideoFadeShader.vertexShader,
      fragmentShader: VideoFadeShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [videoTextureA, videoTextureB, maskTextureA, maskTextureB, videoDirection, maskDirection]);

  useFrame((state, delta) => {
    if (materialRef.current && planeRef.current) {
      // Performance monitoring - warn if frame time is too high
      if (delta > 0.033) { // >30ms = <30fps
        console.warn('Frame time high:', (delta * 1000).toFixed(1), 'ms');
      }
      
      // Debug logging for video direction changes
      const currentVideoMix = materialRef.current.uniforms.videoMix.value;
      if (Math.abs(currentVideoMix - videoDirection) > 0.01) {
        console.log('VideoMix uniform updating from', currentVideoMix.toFixed(3), 'to', videoDirection.toFixed(3));
      }
      
      materialRef.current.uniforms.videoMix.value = videoDirection;
      materialRef.current.uniforms.maskMix.value = maskDirection;
      materialRef.current.uniforms.factorTest.value = factorTest;

      // Calculate target aspect ratios from video metadata or fallback to element properties
      let targetAspectA = 1;
      let targetAspectB = 1;

      // Priority: use provided ratio, then video element properties
      if (videoARatio && videoARatio[0] && videoARatio[1] && videoARatio[1] !== 0) {
        targetAspectA = videoARatio[0] / videoARatio[1];
      } else if (
        videoElementA &&
        videoElementA.readyState >= 2 &&
        videoElementA.videoWidth > 0 &&
        videoElementA.videoHeight > 0
      ) {
        targetAspectA = videoElementA.videoWidth / videoElementA.videoHeight;
      }

      if (videoBRatio && videoBRatio[0] && videoBRatio[1] && videoBRatio[1] !== 0) {
        targetAspectB = videoBRatio[0] / videoBRatio[1];
      } else if (
        videoElementB &&
        videoElementB.readyState >= 2 &&
        videoElementB.videoWidth > 0 &&
        videoElementB.videoHeight > 0
      ) {
        targetAspectB = videoElementB.videoWidth / videoElementB.videoHeight;
      }

      // Smoothly update stored aspect ratios
      const lerpAmt = 0.05; // Slower lerp for smoother transitions
      videoAspectA.current = THREE.MathUtils.lerp(
        videoAspectA.current,
        targetAspectA,
        lerpAmt,
      );
      videoAspectB.current = THREE.MathUtils.lerp(
        videoAspectB.current,
        targetAspectB,
        lerpAmt,
      );

      // Interpolate between the two aspect ratios based on video direction
      const lerpedAspectRatio = THREE.MathUtils.lerp(
        videoAspectA.current,
        videoAspectB.current,
        videoDirection,
      );

      // Apply dynamic scaling based on video aspect ratio (not mask)
      // DISABLED: Now using GSAP animation for scale transitions
      // if (ENABLE_DYNAMIC_SCALING) {
      //   // Scale to maintain aspect ratio - adjust Y scale to accommodate aspect ratio
      //   const targetScaleY = 1 / lerpedAspectRatio;
      //   planeRef.current.scale.set(1, targetScaleY, 1);
      // } else {
      //   planeRef.current.scale.set(1, 1, 1);
      // }

      // Update material uniforms for aspect ratio in shaders
      materialRef.current.uniforms.textureA_aspectRatio.value.set(
        videoAspectA.current,
        1,
      );
      materialRef.current.uniforms.textureB_aspectRatio.value.set(
        videoAspectB.current,
        1,
      );

      materialRef.current.uniforms.uvScale.value = scaleValue;
      materialRef.current.uniforms.maskContrast.value = maskContrast;
      materialRef.current.uniforms.maskBrightness.value = brightness;
    }
  });

  const updateMaterialAspectRatios = () => {
    if (
      materialRef.current &&
      videoElementA &&
      videoElementB &&
      videoElementA.readyState >= 2 &&
      videoElementB.readyState >= 2 &&
      videoElementA.videoWidth > 0 &&
      videoElementA.videoHeight > 0 &&
      videoElementB.videoWidth > 0 &&
      videoElementB.videoHeight > 0
    ) {
      videoAspectA.current =
        videoElementA.videoWidth / videoElementA.videoHeight;
      videoAspectB.current =
        videoElementB.videoWidth / videoElementB.videoHeight;

      const lerpedAspectRatio = THREE.MathUtils.lerp(
        videoAspectA.current,
        videoAspectB.current,
        videoDirection,
      );
      if (ENABLE_DYNAMIC_SCALING) {
        planeRef.current?.scale.set(1, 1 / lerpedAspectRatio, 1);
      } else {
        planeRef.current?.scale.set(1, 1, 1);
      }

      // materialRef.current.uniforms.textureA_aspectRatio.value.set(
      //   videoAspectA.current,
      //   1,
      // );
      // materialRef.current.uniforms.textureB_aspectRatio.value.set(
      //   videoAspectB.current,
      //   1,
      // );
      // materialRef.current.uniforms.uvScale.value = scaleValue;
      // materialRef.current.uniforms.maskContrast.value = maskContrast;
      // materialRef.current.uniforms.maskBrightness.value = brightness;
    }
  };

  const { scaleValue, maskContrast, brightness } = useControls('TripVideoPlane', {
    scaleValue: { value: 2.0, min: 0.1, max: 2.0 },
    maskContrast: { value: 1.0, min: 0, max: 3, step: 0.1 },
    brightness: { value: 2.0, min: 0, max: 3, step: 0.1 },
  });

  return (
    <group scale={[1, 1, 1]}>
      <animated.mesh ref={planeRef} position={[0, 0, 0]}>
        {/* Reduced sphere complexity for better performance */}
        <sphereGeometry args={[15, 24, 12, 0, Math.PI/1]} /> 
        {/* <planeGeometry args={[1, 1, 1, 1]} /> */}
        <primitive object={shaderMaterial} ref={materialRef} />
        {/* <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[1, 1, 1, 1]} />
          <meshBasicMaterial color="red" side={THREE.DoubleSide} />
        </mesh> */}
      </animated.mesh>
    </group>
  );
};

export default TripVideoPlane;
