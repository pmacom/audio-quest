import { useState, useEffect } from "react"
import { CachedMesh, CachedMesh2, CachedMesh3, CachedMesh4 } from "./components/CachedMesh"
import { ShaderManager } from "./shaders/ShaderManager"
import { DemoAudioVisualizersLayout, AmplitudeVisualizer, BeatIntensityPulsar, FrequencyBandsDisplay, DeformablePlane } from "./components"

import * as THREE from 'three';
import TripSequenceShuffler from "./videos/VideoSequencer";
import { VideoSourceEntry, MaskSourceEntry } from "./videos/types";
import { loadAllSources } from "./videos/dataLoader";
import BirdModel from "@/models/modelBird";
import { VideoShaderManager } from "./shaders/VideoShader/VideoShaderManager";
import { CachedVideoMesh } from "./shaders/VideoShader/examples/CacheVideodMesh";

export const PRIMARY_SCENE_CONTENT = () => {
  const [videos, setVideos] = useState<VideoSourceEntry[]>([])
  const [masks, setMasks] = useState<MaskSourceEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSources() {
      try {
        const { videos: loadedVideos, masks: loadedMasks } = await loadAllSources()
        setVideos(loadedVideos)
        setMasks(loadedMasks)
      } catch (error) {
        console.error('Failed to load sources in PRIMARY_SCENE_CONTENT:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSources()
  }, [])

  const scale = 3

  return (
    <>
      {/* <ShaderTest /> */}

      {/* Complete Demo Layout */}
      {/* <DemoAudioVisualizersLayout position={[10, 0, 0]} /> */}

      {/* <group scale={20} position={[0, 0, 0]}>
        <BirdModel />
      </group> */}

      
      <VideoShaderTest />

      {/* {!loading && videos.length > 0 && masks.length > 0 && (
        <group scale={[scale, scale, scale]} rotation={[0, 0, 0]}>
          <TripSequenceShuffler
            videos={videos}
            masks={masks}
            videoHoldDuration={60}
            videoTransitionDuration={4}
          />
        </group>
      )} */}

{/* 
      {true && !loading && videos.length > 0 && masks.length > 0 && (
        <>
          <group scale={[scale, scale, scale]} rotation={[0, Math.PI / 2, 0]}>
            <TripSequenceShuffler
              videos={videos}
              masks={masks}
              videoHoldDuration={60}
              videoTransitionDuration={4}
            />
          </group>
    
          <group scale={[scale, scale, scale]} rotation={[0, Math.PI, 0]}>
            <TripSequenceShuffler
              videos={videos}
              masks={masks}
              videoHoldDuration={60}
              videoTransitionDuration={4}
            />
          </group>

          <group scale={[scale, scale, scale]} rotation={[0, -Math.PI / 2, 0]}>
            <TripSequenceShuffler
              videos={videos}
              masks={masks}
              videoHoldDuration={60}
              videoTransitionDuration={4}
            />
          </group>
        </>
      )} */}
      
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

      {/* THIS WAS WORKING I THINK LAST - I mean I couldn't see the cube or nothing though */}
      <CachedMesh
        shaderId={`amazing-shader-ai-v1`}
        // geometry={new THREE.SphereGeometry(3, 32, 32)}
        position={[0, 0, 0]}
      />
    </>
  )
}



const VideoShaderTest = () => {
  return (
    <>
      <VideoShaderManager />
      {/* <CachedMesh2 shaderId={`amazing-shader-ai-v3`} />
      <CachedMesh2 shaderId={`amazing-shader-ai-v1`} geometry={new THREE.SphereGeometry(3, 32, 32)} />
      <CachedMesh shaderId={`amazing-shader-ai-v1`} geometry={new THREE.SphereGeometry(3, 32, 32)} /> */}

      {/* THIS WAS WORKING I THINK LAST - I mean I couldn't see the cube or nothing though */}
      <CachedVideoMesh
        shaderId={`amazing-shader-ai-v1`}
        // geometry={new THREE.SphereGeometry(3, 32, 32)}
        position={[0, 0, 0]}
      />
    </>
  )
}
