"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipForward, Maximize, RotateCcw } from "lucide-react"
import { VideoSourceEntry, MaskSourceEntry } from "@/Freq530/videos/types"

interface Props {
  item: VideoSourceEntry | MaskSourceEntry
  previewSpeed?: number
}

export function VideoPreview({ item, previewSpeed }: Props) {
  const [isPlaying, setIsPlaying] = useState(true) // Start playing by default
  const [progress, setProgress] = useState(0)
  const [fileSize, setFileSize] = useState<string | null>(null)
  const [bounceFileSize, setBounceFileSize] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Helper function to get the correct video source based on mode setting
  const getVideoSrc = (source: VideoSourceEntry | MaskSourceEntry) => {
    // If bounce mode and bounceSrc exists, use it
    if (source.mode === "bounce" && source.bounceSrc) {
      return source.bounceSrc
    }
    
    // If bounce mode but no bounceSrc, construct the bounce_ prefixed path
    if (source.mode === "bounce") {
      const pathParts = source.clipSrc.split('/')
      const filename = pathParts[pathParts.length - 1]
      const directory = pathParts.slice(0, -1).join('/')
      const bounceFilename = `bounce_${filename}`
      return `${directory}/${bounceFilename}`
    }
    
    // Otherwise use original clipSrc
    return source.clipSrc
  }

  const videoSrc = getVideoSrc(item)

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file size via HEAD request
  const getFileSize = async (url: string): Promise<number | null> => {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      const contentLength = response.headers.get('content-length')
      return contentLength ? parseInt(contentLength, 10) : null
    } catch (error) {
      console.error('Error getting file size:', error)
      return null
    }
  }

  // Load file sizes
  useEffect(() => {
    const loadFileSizes = async () => {
      // Get main file size
      const mainSize = await getFileSize(item.clipSrc)
      if (mainSize) {
        setFileSize(formatFileSize(mainSize))
      }

      // Get bounce file size if it exists
      if (item.bounceSrc) {
        const bounceSize = await getFileSize(item.bounceSrc)
        if (bounceSize) {
          setBounceFileSize(formatFileSize(bounceSize))
        }
      } else {
        setBounceFileSize(null)
      }
    }

    loadFileSizes()
  }, [item.clipSrc, item.bounceSrc])

  // Handle play/pause
  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Skip to last 2 seconds of video
  const handleSkipToEnd = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    
    const targetTime = Math.max(0, video.duration - 2)
    video.currentTime = targetTime
  }

  // Jump to 2 seconds in
  const handleJumpTo2Seconds = () => {
    const video = videoRef.current
    if (!video) return
    
    video.currentTime = Math.min(2, video.duration || 2)
  }

  // Toggle fullscreen
  const handleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        e.preventDefault()
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  // Handle preview speed changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (previewSpeed !== undefined) {
      video.playbackRate = previewSpeed
    } else {
      video.playbackRate = 1.0
    }
  }, [previewSpeed])

  // Video event handlers and auto-play
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime !== undefined) {
        const currentProgress = (video.currentTime / video.duration) * 100
        setProgress(currentProgress)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    // Auto-start playing when video loads
    const handleLoadedData = () => {
      video.play().catch(err => {
        console.log('Auto-play failed:', err)
        setIsPlaying(false)
      })
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handlePause)
    video.addEventListener('loadeddata', handleLoadedData)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handlePause)
      video.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [videoSrc])



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Video Preview</h3>
        <div className="text-sm text-muted-foreground">
          {isPlaying ? 'Playing' : 'Paused'}
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className={`relative w-full bg-black rounded-lg overflow-hidden group ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
        onClick={isFullscreen ? handleFullscreen : undefined}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          loop
          muted
          playsInline
          autoPlay
          className={`w-full object-contain ${isFullscreen ? 'h-screen' : 'h-[50vh] md:h-[60vh] lg:h-[70vh] xl:h-[75vh]'}`}
        />
        
        {/* Controls overlay - only show when not fullscreen */}
        {!isFullscreen && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <Button
                onClick={handleJumpTo2Seconds}
                size="sm"
                variant="secondary"
                className="bg-black/70 hover:bg-black/90 text-white backdrop-blur-sm w-10 h-10 p-0"
                title="Jump to 2 seconds"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handleFullscreen}
                size="sm"
                variant="secondary"
                className="bg-black/70 hover:bg-black/90 text-white backdrop-blur-sm w-10 h-10 p-0"
                title="Fullscreen"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Fullscreen exit hint */}
        {isFullscreen && (
          <div className="absolute top-4 left-4 bg-black/80 text-white text-sm px-3 py-2 rounded">
            Press any key or click to exit fullscreen
          </div>
        )}
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/70">
          <div 
            className="h-full bg-red-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Mode indicator */}
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {item.mode === "bounce" ? 'Bounce' : 'Loop'}
        </div>
      </div>
      
      {/* Video info */}
      <div className="text-sm text-muted-foreground space-y-2">
        <div>
          <p className="font-medium">Source: {item.clipSrc.split('/').pop()}</p>
          {fileSize && (
            <p className="text-xs">Size: {fileSize}</p>
          )}
        </div>
        
        {item.bounceSrc && (
          <div>
            <p className="font-medium">Bounce: {item.bounceSrc.split('/').pop()}</p>
            {bounceFileSize && (
              <p className="text-xs">Size: {bounceFileSize}</p>
            )}
          </div>
        )}
        
        <div className="flex gap-4">
          {item.orientation && (
            <p>Orientation: {item.orientation} ({item.width}×{item.height})</p>
          )}
          {item.length && (
            <p>Duration: {item.length.toFixed(2)}s</p>
          )}
        </div>
        
        <div className="text-xs pt-2 border-t border-muted">
          <p>Mode: {item.mode === "bounce" ? 'Bounce' : 'Loop'} 
            {item.mode === "bounce" && item.bounceSrc ? ' (using bounce file)' : ''}
            {item.mode === "bounce" && !item.bounceSrc ? ' (no bounce file available)' : ''}
          </p>
        </div>
      </div>
    </div>
  )
} 