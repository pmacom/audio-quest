import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { animated } from '@react-spring/three';
import VideoFadeShader from './VideoFadeShader';
import { useControls } from 'leva';
import { useFreq530 } from '../audio/store/useFreq530';
import { useVideoTexturesOptimized } from '../hooks/useVideoTextureOptimized';

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
}

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
}: TripVideoPlaneProps) => {
  const amplitude = useFreq530(state => state.values.amplitude)
  const planeRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  // Store aspect ratio values so we can smoothly transition when sources change
  const videoAspectA = useRef(1);
  const videoAspectB = useRef(1);
  const maskAspectA = useRef(1);
  const maskAspectB = useRef(1);
  const planeScaleY = useRef(1);

  const {
    textures: [videoTextureA, videoTextureB],
    videos: [videoElementA, videoElementB],
  } = useVideoTexturesOptimized(
    [
      { urls: [videoA], bounce: bounceVideoA },
      { urls: [videoB], bounce: bounceVideoB },
    ],
    amplitude
  )

  const maskRate = Math.min(Math.max(amplitude / 2, 0.1), 4)
  const {
    textures: [maskTextureA, maskTextureB],
    videos: [maskElementA, maskElementB],
  } = useVideoTexturesOptimized([
    { urls: [maskA], bounce: bounceMaskA },
    { urls: [maskB], bounce: bounceMaskB },
  ], maskRate)

  const { factorTest, widthTester } = useControls('TripVideoPlane', {
    factorTest: { value: 0.3, min: 0, max: 1 },
    widthTester: { value: 0.3, min: 0, max: 6, step: 0.1 },
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
      updateMaterialAspectRatios();
    }
  }, [videoTextureA, videoTextureB, maskTextureA, maskTextureB, amplitude]);


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
        maskA_aspectRatio: { value: new THREE.Vector2(1, 1) },
        maskB_aspectRatio: { value: new THREE.Vector2(1, 1) },
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

  useFrame(() => {
    if (
      materialRef.current &&
      planeRef.current &&
      videoElementA &&
      videoElementB &&
      maskElementA &&
      maskElementB &&
      videoElementA.readyState >= 2 &&
      videoElementB.readyState >= 2 &&
      maskElementA.readyState >= 2 &&
      maskElementB.readyState >= 2
    ) {
      materialRef.current.uniforms.videoMix.value = videoDirection;
      materialRef.current.uniforms.maskMix.value = maskDirection;
      materialRef.current.uniforms.factorTest.value = factorTest;

      if (
        videoElementA.videoWidth > 0 &&
        videoElementA.videoHeight > 0 &&
        videoElementB.videoWidth > 0 &&
        videoElementB.videoHeight > 0 &&
        maskElementA.videoWidth > 0 &&
        maskElementA.videoHeight > 0 &&
        maskElementB.videoWidth > 0 &&
        maskElementB.videoHeight > 0
      ) {
        const targetAspectA =
          videoElementA.videoWidth / videoElementA.videoHeight;
        const targetAspectB =
          videoElementB.videoWidth / videoElementB.videoHeight;
        const targetMaskAspectA =
          maskElementA.videoWidth / maskElementA.videoHeight;
        const targetMaskAspectB =
          maskElementB.videoWidth / maskElementB.videoHeight;

        // Smoothly update stored aspect ratios
        const lerpAmt = 0.1;
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
        maskAspectA.current = THREE.MathUtils.lerp(
          maskAspectA.current,
          targetMaskAspectA,
          lerpAmt,
        );
        maskAspectB.current = THREE.MathUtils.lerp(
          maskAspectB.current,
          targetMaskAspectB,
          lerpAmt,
        );

        const lerpedAspectRatio = THREE.MathUtils.lerp(
          videoAspectA.current,
          videoAspectB.current,
          videoDirection,
        );

        const targetScaleY = 1 / lerpedAspectRatio;
        planeScaleY.current = THREE.MathUtils.lerp(
          planeScaleY.current,
          targetScaleY,
          lerpAmt,
        );

        planeRef.current.scale.set(1, planeScaleY.current, 1);

        materialRef.current.uniforms.textureA_aspectRatio.value.set(
          videoAspectA.current,
          1,
        );
        materialRef.current.uniforms.textureB_aspectRatio.value.set(
          videoAspectB.current,
          1,
        );
        materialRef.current.uniforms.maskA_aspectRatio.value.set(
          maskAspectA.current,
          1,
        );
        materialRef.current.uniforms.maskB_aspectRatio.value.set(
          maskAspectB.current,
          1,
        );

        materialRef.current.uniforms.uvScale.value = scaleValue;
        materialRef.current.uniforms.maskContrast.value = maskContrast;
        materialRef.current.uniforms.maskBrightness.value = brightness;
      }
    }
  });

  const updateMaterialAspectRatios = () => {
    if (
      materialRef.current &&
      videoElementA &&
      videoElementB &&
      maskElementA &&
      maskElementB &&
      videoElementA.readyState >= 2 &&
      videoElementB.readyState >= 2 &&
      maskElementA.readyState >= 2 &&
      maskElementB.readyState >= 2 &&
      videoElementA.videoWidth > 0 &&
      videoElementA.videoHeight > 0 &&
      videoElementB.videoWidth > 0 &&
      videoElementB.videoHeight > 0 &&
      maskElementA.videoWidth > 0 &&
      maskElementA.videoHeight > 0 &&
      maskElementB.videoWidth > 0 &&
      maskElementB.videoHeight > 0
    ) {
      videoAspectA.current =
        videoElementA.videoWidth / videoElementA.videoHeight;
      videoAspectB.current =
        videoElementB.videoWidth / videoElementB.videoHeight;
      maskAspectA.current =
        maskElementA.videoWidth / maskElementA.videoHeight;
      maskAspectB.current =
        maskElementB.videoWidth / maskElementB.videoHeight;

      const lerpedAspectRatio = THREE.MathUtils.lerp(
        videoAspectA.current,
        videoAspectB.current,
        videoDirection,
      );
      planeScaleY.current = 1 / lerpedAspectRatio;
      planeRef.current?.scale.set(1, planeScaleY.current, 1);

      materialRef.current.uniforms.textureA_aspectRatio.value.set(
        videoAspectA.current,
        1,
      );
      materialRef.current.uniforms.textureB_aspectRatio.value.set(
        videoAspectB.current,
        1,
      );
      materialRef.current.uniforms.maskA_aspectRatio.value.set(
        maskAspectA.current,
        1,
      );
      materialRef.current.uniforms.maskB_aspectRatio.value.set(
        maskAspectB.current,
        1,
      );
      materialRef.current.uniforms.uvScale.value = scaleValue;
      materialRef.current.uniforms.maskContrast.value = maskContrast;
      materialRef.current.uniforms.maskBrightness.value = brightness;
    }
  };

  const { scaleValue, scaleX, scaleY, scaleZ, maskContrast, brightness } = useControls('TripVideoPlane', {
    scaleValue: { value: 2.0, min: 0.1, max: 2.0 },
    scaleX: { value: 1.2, min: -3, max: 3, step: 0.1 },
    scaleY: { value: 1.0, min: -3, max: 3, step: 0.1 },
    scaleZ: { value: 0.9, min: -3, max: 3, step: 0.1 },
    maskContrast: { value: 1.0, min: 0, max: 3, step: 0.1 },
    brightness: { value: 2.0, min: 0, max: 3, step: 0.1 },
  });

  return (
    <group scale={[scaleX, scaleY, scaleZ]}>
      <animated.mesh ref={planeRef} position={[0, 0, 0]}>
        <sphereGeometry args={[15, 32, 16, 0, Math.PI/1]} /> 
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
