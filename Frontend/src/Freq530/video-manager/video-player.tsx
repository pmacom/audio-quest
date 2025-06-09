"use client"

import { useEffect, useRef, useState } from "react"
import type { VideoFile } from "./types"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react"

interface VideoPlayerProps {
  video: VideoFile
  onClose: () => void
}

export function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackDirection, setPlaybackDirection] = useState<"forward" | "reverse">("forward")
  const [videoSrc, setVideoSrc] = useState<string>(video.url)

  // Determine if the URL is a local path or a blob URL
  useEffect(() => {
    // If it's a local path (not a blob URL), prepend with / if needed
    if (!video.url.startsWith("blob:") && !video.url.startsWith("/")) {
      setVideoSrc(`/${video.url}`)
    } else {
      setVideoSrc(video.url)
    }
  }, [video.url])

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handleTimeUpdate = () => {
      if (video.mirror && playbackDirection === "reverse") {
        // Handle reverse playback for mirror mode
        const newTime = videoElement.currentTime - 0.1
        if (newTime <= 0) {
          setPlaybackDirection("forward")
          videoElement.currentTime = 0
        } else {
          videoElement.currentTime = newTime
        }
      }
      setCurrentTime(videoElement.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration)
    }

    const handleEnded = () => {
      if (video.loop) {
        if (video.mirror && playbackDirection === "forward") {
          setPlaybackDirection("reverse")
          videoElement.currentTime = videoElement.duration
        } else {
          videoElement.currentTime = 0
          videoElement.play()
        }
      } else {
        setIsPlaying(false)
      }
    }

    videoElement.addEventListener("timeupdate", handleTimeUpdate)
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata)
    videoElement.addEventListener("ended", handleEnded)

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate)
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
      videoElement.removeEventListener("ended", handleEnded)
    }
  }, [video.loop, video.mirror, playbackDirection])

  const togglePlay = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (isPlaying) {
      videoElement.pause()
    } else {
      videoElement.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const newTime = (value[0] / 100) * duration
    videoElement.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const newVolume = value[0] / 100
    videoElement.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (isMuted) {
      videoElement.volume = volume
      setIsMuted(false)
    } else {
      videoElement.volume = 0
      setIsMuted(true)
    }
  }

  const toggleFullscreen = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoElement.requestFullscreen()
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video ref={videoRef} src={videoSrc} className="w-full h-auto max-h-[60vh]" onClick={togglePlay} />

        {/* Video Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="space-y-2">
            {/* Progress Bar */}
            <Slider
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
            />

            {/* Control Buttons */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={togglePlay} className="text-white hover:bg-white/20">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {video.mirror && (
                  <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded">
                    <RotateCcw className="h-3 w-3" />
                    Mirror: {playbackDirection}
                  </div>
                )}

                {video.loop && <div className="text-xs bg-white/20 px-2 py-1 rounded">Loop: ON</div>}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={toggleMute} className="text-white hover:bg-white/20">
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>

                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-20"
                />

                <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="space-y-2">
        <h3 className="font-semibold">{video.name}</h3>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>Directory: {video.directory}</span>
          <span>•</span>
          <span>Size: {(video.size / (1024 * 1024)).toFixed(2)} MB</span>
          {video.tags.length > 0 && (
            <>
              <span>•</span>
              <span>Tags: {video.tags.join(", ")}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
