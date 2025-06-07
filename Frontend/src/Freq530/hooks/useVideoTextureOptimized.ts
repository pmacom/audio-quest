import { useEffect, useState } from 'react'
import * as THREE from 'three'

export interface VideoSource {
  /** Possible URLs for the video. The first one that loads will be used. */
  urls: string[]
  /**
   * When true, the video reverses direction at the end and plays
   * back towards the start before continuing forward again.
   */
  bounce?: boolean
}

export function useVideoTexturesOptimized(
  videos: VideoSource[],
  playbackRate: number
) {
  const [videoEls, setVideoEls] = useState<HTMLVideoElement[]>([])
  const [textures, setTextures] = useState<THREE.VideoTexture[]>([])

  useEffect(() => {
    const vids: HTMLVideoElement[] = []
    const texs: THREE.VideoTexture[] = []

    for (const src of videos) {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.loop = !src.bounce
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'

      let currentIdx = 0
      const tryLoad = (idx: number) => {
        currentIdx = idx
        video.src = src.urls[idx]
        const p = video.play()
        if (p) p.catch(() => {})
      }

      video.playbackRate = playbackRate

      video.addEventListener('error', () => {
        if (currentIdx + 1 < src.urls.length) {
          tryLoad(currentIdx + 1)
        }
      })

      if (src.bounce) {
        video.addEventListener('ended', () => {
          video.playbackRate = -Math.abs(playbackRate)
          video.play().catch(() => {})
        })
        video.addEventListener('timeupdate', () => {
          if (video.playbackRate < 0 && video.currentTime <= 0) {
            video.playbackRate = Math.abs(playbackRate)
            video.play().catch(() => {})
          }
        })
      }

      tryLoad(0)

      const texture = new THREE.VideoTexture(video)
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.format = THREE.RGBFormat
      texture.generateMipmaps = false
      texture.needsUpdate = true

      vids.push(video)
      texs.push(texture)
    }

    setVideoEls(vids)
    setTextures(texs)

    return () => {
      texs.forEach(t => t.dispose())
      vids.forEach(v => {
        v.pause()
        v.src = ''
      })
    }
  }, [JSON.stringify(videos)])

  useEffect(() => {
    videoEls.forEach(v => {
      const sign = Math.sign(v.playbackRate) || 1
      v.playbackRate = sign * playbackRate
    })
  }, [playbackRate, videoEls])

  return { textures, videos: videoEls }
}

export function useVideoTextureOptimized(src: string, playbackRate: number, bounce?: boolean) {
  const { videos, textures } = useVideoTexturesOptimized([{ urls: [src], bounce }], playbackRate)
  return { texture: textures[0] ?? null, video: videos[0] ?? null }
}
