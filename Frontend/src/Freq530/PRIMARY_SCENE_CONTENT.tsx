import { CachedMesh, CachedMesh2, CachedMesh3, CachedMesh4 } from "./components/CachedMesh"
import { ShaderManager } from "./shaders/ShaderManager"
import { DemoAudioVisualizersLayout, AmplitudeVisualizer, BeatIntensityPulsar, FrequencyBandsDisplay, DeformablePlane } from "./components"

import * as THREE from 'three';
import TripSequenceShuffler from "./videos/VideoSequencer";
import { VIDEO_SOURCES } from "./videos/videoList";
import { MASK_SOURCES } from "./videos/maskList";

export const PRIMARY_SCENE_CONTENT = () => {
  const testNumber = 2;
  return (
    <>
      {/* <ShaderTest /> */}

      {/* Complete Demo Layout */}
      <DemoAudioVisualizersLayout position={[10, 0, 0]} />

      <TripSequenceShuffler
        videos={VIDEO_SOURCES}
        masks={MASK_SOURCES}
        videoHoldDuration={8}
        videoTransitionDuration={4}
      />
    </>
  )
}


const ShaderTest = () => {
  return (
    <>
      <ShaderManager />
      {/* <CachedMesh2 shaderId={`amazing-shader-ai-v3`} />
      <CachedMesh2 shaderId={`amazing-shader-ai-v1`} geometry={new THREE.SphereGeometry(3, 32, 32)} />
      <CachedMesh shaderId={`amazing-shader-ai-v1`} geometry={new THREE.SphereGeometry(3, 32, 32)} /> */}
      <CachedMesh
        shaderId={`amazing-shader-ai-v1`}
        // geometry={new THREE.SphereGeometry(3, 32, 32)}
        position={[0, 0, 0]}
      />
    </>
  )
}
