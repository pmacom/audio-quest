import { useEffect, useState, useRef } from 'react'
import * as THREE from 'three'

export interface VideoSource {
  /** Possible URLs for the video. The first one that loads will be used. */
  urls: string[]
}

export function useVideoTexturesOptimized(
  videos: VideoSource[],
  playbackRate: number | number[],
  /** Optional: blend states for conditional optimization. Array of [0,1] values indicating visibility */
  blendStates?: number[]
) {
  const [textures, setTextures] = useState<THREE.VideoTexture[]>([])
  const [videoEls, setVideoEls] = useState<HTMLVideoElement[]>([])

  useEffect(() => {
    const vids: HTMLVideoElement[] = []
    const texs: THREE.VideoTexture[] = []

    for (let i = 0; i < videos.length; i++) {
      const src = videos[i]
      console.log('Creating video element for URLs:', src.urls);
      
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'
      video.loop = true // Always loop - bounce is handled via file switching
      
      // 🎵 Apply individual playback rate if array provided, otherwise use single rate
      const individualRate = Array.isArray(playbackRate) ? playbackRate[i] || 1.0 : playbackRate
      video.playbackRate = individualRate

      const texture = new THREE.VideoTexture(video)
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.format = THREE.RGBFormat
      texture.generateMipmaps = false
      texture.needsUpdate = true

      let currentIdx = 0
      const tryLoad = (idx: number) => {
        currentIdx = idx
        video.src = src.urls[idx]
        const p = video.play()
        if (p) p.catch(() => {})
      }

      video.addEventListener('error', () => {
        if (currentIdx + 1 < src.urls.length) {
          tryLoad(currentIdx + 1)
        }
      })

      tryLoad(0)

      vids.push(video)
      texs.push(texture)
    }

    setVideoEls(vids)
    setTextures(texs)

    return () => {
      // Memory optimization: Properly dispose of textures and clear video resources
      texs.forEach(t => {
        t.dispose()
        t.image = null // Clear image reference for GC
      })
      vids.forEach(v => {
        v.pause()
        v.removeAttribute('src') // More thorough than setting src = ''
        v.load() // Reset video element
      })
    }
  }, [JSON.stringify(videos)])

  useEffect(() => {
    // 🎵 Update playback rate for each video individually or all with single rate
    videoEls.forEach((v, i) => {
      const individualRate = Array.isArray(playbackRate) ? playbackRate[i] || 1.0 : playbackRate
      v.playbackRate = individualRate
    })
  }, [playbackRate, videoEls])

  return { textures, videos: videoEls }
}

// Legacy single video hook for compatibility
export function useVideoTextureOptimized(src: string, playbackRate: number) {
  const { textures, videos } = useVideoTexturesOptimized([{ urls: [src] }], playbackRate)
  return { texture: textures[0], video: videos[0] }
}

