import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVideoStore } from '../stores/useVideoStore';
import { useVideoSequencer } from '../stores/useVideoSequencer';
import { DEBUG_VideoList } from './VideoUpdater';
import { ALPHA_MASK_PATHS, VIDEO_PATHS } from '../VIDEO_PATHS';
import { DisplacementMatrix } from './DisplacementMatrix';

interface VideoFade3Props {
  videoSettings: { name: string; src: string; isMirror?: boolean; speedMultiplier?: number }[];
  alphaSettings: { name: string; src: string; isMirror?: boolean; speedMultiplier?: number }[];
}
export const VideoFade3 = () => {
  const texture1Ref = useRef<THREE.Mesh | null>(null);
  const texture2Ref = useRef<THREE.Mesh | null>(null);
  const fade = useVideoSequencer(s => s.fade)
  

  return (
    <group>
      
      <mesh ref={texture1Ref} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" />
      </mesh>

      <mesh ref={texture2Ref} position={[0, 1, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="blue" />
      </mesh>
    </group>
  )
};

// Test component
export const TestVideoFade3 = () => {
  return (
    <group>
      <VideoFade3 />
    </group>
  );
};

export default TestVideoFade3;