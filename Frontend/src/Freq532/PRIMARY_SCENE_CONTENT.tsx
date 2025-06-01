import { CachedMesh, CachedMesh2, CachedMesh3, CachedMesh4 } from "./components/CachedMesh"
import { ShaderManager } from "./shaders/ShaderManager"
import { DemoAudioVisualizersLayout, AmplitudeVisualizer, BeatIntensityPulsar, FrequencyBandsDisplay } from "./components"
import * as THREE from 'three';

export const PRIMARY_SCENE_CONTENT = () => {
  const testNumber = 2;
  return (
    <>
      <ShaderManager />
      {/* <CachedMesh2 shaderId={`amazing-shader-ai-v3`} />
      <CachedMesh2 shaderId={`amazing-shader-ai-v1`} geometry={new THREE.SphereGeometry(3, 32, 32)} />
      <CachedMesh shaderId={`amazing-shader-ai-v1`} geometry={new THREE.SphereGeometry(3, 32, 32)} /> */}
      <CachedMesh
        shaderId={`amazing-shader-ai-v1`}
        // geometry={new THREE.SphereGeometry(3, 32, 32)}
      />
      
      {/* Audio Visualizers */}
      <group position={[0, -5, 0]}>
        <DemoAudioVisualizersLayout />
      </group>
      
      {/* Individual visualizers positioned around the main shader mesh */}
      <AmplitudeVisualizer position={[-8, 2, 0]} />
      <BeatIntensityPulsar position={[8, 2, 0]} />
      {/* <FrequencyBandsDisplay position={[0, -8, 0]} scale={0.8} /> */}
    </>
  )
}
