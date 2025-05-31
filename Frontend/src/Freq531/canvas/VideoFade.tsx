import { useState, useMemo, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVideoStore } from '../stores/useVideoStore';
import { DEBUG_VideoList } from './VideoUpdater';

interface VideoFadeProps {
  videoName1: string;
  videoName2: string;
}

export const VideoFade = ({ videoName1, videoName2 }: VideoFadeProps) => {
  const videos = useVideoStore((state) => state.videos);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Always call hooks unconditionally
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        texture1: { value: null },
        texture2: { value: null },
        fade: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D texture1;
        uniform sampler2D texture2;
        uniform float fade;
        varying vec2 vUv;
        void main() {
          vec4 color1 = texture2D(texture1, vUv);
          vec4 color2 = texture2D(texture2, vUv);
          gl_FragColor = mix(color1, color2, fade);
        }
      `,
      transparent: true,
    });
    return mat;
  }, []);

  // Attach material ref
  useEffect(() => {
    materialRef.current = material;
  }, [material]);

  useFrame(() => {
    // Animate fade: oscillate from 0 to 1 and back over 5 seconds
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const period = 5; // seconds
    const t = (elapsed % period) / period; // 0 to 1
    // Use a sine wave for smooth ping-pong
    const fade = 0.5 * (1 - Math.cos(2 * Math.PI * t));

    // Update material uniforms
    const videoData1 = videos[videoName1]?.current;
    const videoData2 = videos[videoName2]?.current;
    if (materialRef.current) {
      materialRef.current.uniforms.texture1.value = videoData1?.texture || null;
      materialRef.current.uniforms.texture2.value = videoData2?.texture || null;
      materialRef.current.uniforms.fade.value = fade;
    }
  });

  useEffect(() => {
    // Load videos if not already loaded
    const video1 = DEBUG_VideoList.find(v => v.name === videoName1);
    const video2 = DEBUG_VideoList.find(v => v.name === videoName2);
    if (video1) {
      useVideoStore.getState().loadVideo(video1);
    }
    if (video2) {
      useVideoStore.getState().loadVideo(video2);
    }
  }, [videoName1, videoName2]);
  
  return (
    <mesh>
      <planeGeometry args={[16, 9]} />
      <primitive object={material} />
    </mesh>
  );
};

// Test component with efficient fade animation
export const TestVideoFade = () => {
  return (
    <VideoFade
      videoName1={DEBUG_VideoList[1].name}
      videoName2={DEBUG_VideoList[2].name}
    />
  );
};

export default TestVideoFade;