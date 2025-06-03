import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { animated } from '@react-spring/three';
import VideoFadeShader from './VideoFadeShader';
import { useControls } from 'leva';
import { useFreq530 } from '../audio/store/useFreq530';

interface TripVideoPlaneProps {
  amplitude: number;
  videoA: string;
  videoB: string;
  maskA: string;
  maskB: string;
  videoDirection: number; // Value between 0 and 1 for transitioning between videos
  maskDirection: number;  // Value between 0 and 1 for transitioning between masks
}

const TripVideoPlane = ({
  // amplitude,
  videoA,
  videoB,
  maskA,
  maskB,
  videoDirection,
  maskDirection,
}: TripVideoPlaneProps) => {
  const amplitude = useFreq530(state => state.values.amplitude)
  const planeRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const videoElementA = useMemo(() => document.createElement('video'), []);
  const videoElementB = useMemo(() => document.createElement('video'), []);
  const maskElementA = useMemo(() => document.createElement('video'), []);
  const maskElementB = useMemo(() => document.createElement('video'), []);

  const videoTextureA = useMemo(() => new THREE.VideoTexture(videoElementA), [videoElementA]);
  const videoTextureB = useMemo(() => new THREE.VideoTexture(videoElementB), [videoElementB]);
  const maskTextureA = useMemo(() => new THREE.VideoTexture(maskElementA), [maskElementA]);
  const maskTextureB = useMemo(() => new THREE.VideoTexture(maskElementB), [maskElementB]);

  const { factorTest, widthTester } = useControls('TripVideoPlane', {
    factorTest: { value: 0.3, min: 0, max: 1 },
    widthTester: { value: 0.3, min: 0, max: 6, step: 0.1 },
  });

  useEffect(() => {
    videoElementA.src = videoA;
    videoElementB.src = videoB;
    maskElementA.src = maskA;
    maskElementB.src = maskB;

    for (const video of [videoElementA, videoElementB, maskElementA, maskElementB]) {
      video.loop = true;
      video.muted = true;
      video.crossOrigin = 'anonymous';
    }

    const handleCanPlayThrough = () => {
      videoElementA.play().catch(e => console.error("Video A play error:", e));
      videoElementB.play().catch(e => console.error("Video B play error:", e));
      maskElementA.play().catch(e => console.error("Mask A play error:", e));
      maskElementB.play().catch(e => console.error("Mask B play error:", e));

      videoTextureA.needsUpdate = true;
      videoTextureB.needsUpdate = true;
      maskTextureA.needsUpdate = true;
      maskTextureB.needsUpdate = true;

      updateMaterialAspectRatios();
    };

    videoElementA.addEventListener('canplaythrough', handleCanPlayThrough);
    videoElementB.addEventListener('canplaythrough', handleCanPlayThrough);
    maskElementA.addEventListener('canplaythrough', handleCanPlayThrough);
    maskElementB.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      videoElementA.removeEventListener('canplaythrough', handleCanPlayThrough);
      videoElementB.removeEventListener('canplaythrough', handleCanPlayThrough);
      maskElementA.removeEventListener('canplaythrough', handleCanPlayThrough);
      maskElementB.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [videoA, videoB, maskA, maskB]);

  useEffect(() => {
    videoElementA.playbackRate = amplitude;
    videoElementB.playbackRate = amplitude;
    maskElementA.playbackRate = Math.min(Math.max(amplitude / 2, 0.1), 4);
    maskElementB.playbackRate = Math.min(Math.max(amplitude / 2, 0.1), 4);
  }, [amplitude]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.textureA.value = videoTextureA;
      materialRef.current.uniforms.textureB.value = videoTextureB;
      materialRef.current.uniforms.amplitude.value = amplitude;
      materialRef.current.uniforms.maskA.value = maskTextureA;
      materialRef.current.uniforms.maskB.value = maskTextureB;

      updateMaterialAspectRatios();
    }
  }, [videoTextureA, videoTextureB, maskTextureA, maskTextureB]);

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
    if (materialRef.current && planeRef.current) {
      materialRef.current.uniforms.videoMix.value = videoDirection;
      materialRef.current.uniforms.maskMix.value = maskDirection;
      materialRef.current.uniforms.factorTest.value = factorTest;

      const aspectRatioA = videoElementA.videoWidth / videoElementA.videoHeight;
      const aspectRatioB = videoElementB.videoWidth / videoElementB.videoHeight;

      // Lerp between aspect ratios based on videoMix
      const lerpedAspectRatio = THREE.MathUtils.lerp(aspectRatioA, aspectRatioB, videoDirection);

      // Adjust the plane's scale to match the lerped aspect ratio
      const scaleX = 1; // Width remains constant
      const scaleY = 1 / lerpedAspectRatio; // Height is adjusted based on aspect ratio

      planeRef.current.scale.set(scaleX, scaleY, 1);

      updateMaterialAspectRatios();
    }
  });

  const updateMaterialAspectRatios = () => {
    if (materialRef.current) {
      const aspectRatioA = new THREE.Vector2(
        videoElementA.videoWidth / videoElementA.videoHeight,
        1
      );
      const aspectRatioB = new THREE.Vector2(
        videoElementB.videoWidth / videoElementB.videoHeight,
        1
      );

      const maskAspectRatioA = new THREE.Vector2(
        maskElementA.videoWidth / maskElementA.videoHeight,
        1
      );
      const maskAspectRatioB = new THREE.Vector2(
        maskElementB.videoWidth / maskElementB.videoHeight,
        1
      );

      materialRef.current.uniforms.textureA_aspectRatio.value = aspectRatioA;
      materialRef.current.uniforms.textureB_aspectRatio.value = aspectRatioB;
      materialRef.current.uniforms.maskA_aspectRatio.value = maskAspectRatioA;
      materialRef.current.uniforms.maskB_aspectRatio.value = maskAspectRatioB;
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
