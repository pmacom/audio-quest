"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import { VideoSourceEntry, MaskSourceEntry } from "@/Freq530/videos/types"
import { TagSelector } from "./tag-selector"

interface Props {
  source: VideoSourceEntry | MaskSourceEntry
  onUpdate: (updates: Partial<VideoSourceEntry | MaskSourceEntry>) => void
}

export function SourceCard({ source, onUpdate }: Props) {
  const [preview, setPreview] = useState(false)
  const [progress, setProgress] = useState(0)
  const [testingSpeed, setTestingSpeed] = useState<'min' | 'max' | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTitle, setEditingTitle] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)

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

  const videoSrc = getVideoSrc(source)
  
  // Handle speed changes with validation
  const handleSpeedMinChange = (value: number[]) => {
    const newMin = value[0]
    const currentMax = source.customSpeedMax || 1.0
    
    if (newMin >= currentMax) {
      onUpdate({ 
        customSpeedMin: Math.max(0.2, currentMax - 0.1),
        customSpeedMax: currentMax 
      })
    } else {
      onUpdate({ customSpeedMin: newMin })
    }
  }
  
  const handleSpeedMaxChange = (value: number[]) => {
    const newMax = value[0]
    const currentMin = source.customSpeedMin || 0.5
    
    if (newMax <= currentMin) {
      onUpdate({ 
        customSpeedMin: currentMin,
        customSpeedMax: Math.min(2.5, currentMin + 0.1)
      })
    } else {
      onUpdate({ customSpeedMax: newMax })
    }
  }

  // Switch logic: ON = bounce mode, OFF = loop mode  
  const handleModeToggle = (checked: boolean) => {
    onUpdate({ mode: checked ? "bounce" : "loop" }) // checked=true means bounce mode
  }

  // Edit title functionality
  const handleEditClick = () => {
    setEditingTitle(source.title || source.clipSrc.split('/').pop()?.replace('.mp4', '') || '')
    setShowEditModal(true)
  }

  const handleSaveTitle = () => {
    onUpdate({ title: editingTitle })
    setShowEditModal(false)
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setEditingTitle("")
  }

  // Video playback and progress management - simplified to always use normal looping
  useEffect(() => {
    const video = videoRef.current
    if (!video || !preview) return

    // Initialize video settings
    video.muted = true
    video.loop = true

    // Apply current testing speed or default
    const currentSpeed = testingSpeed === 'min' 
      ? (source.customSpeedMin || 0.5)
      : testingSpeed === 'max' 
        ? (source.customSpeedMax || 1.0)
        : 1.0

    // Set playback rate and start playing
    video.playbackRate = currentSpeed
    video.currentTime = 0
    video.play()
    
    const updateProgress = () => {
      if (video.duration && video.currentTime !== undefined) {
        const currentProgress = (video.currentTime / video.duration) * 100
        setProgress(currentProgress)
      }
    }
    
    // Update progress on time updates
    video.addEventListener('timeupdate', updateProgress)
    video.addEventListener('loadedmetadata', updateProgress)

    // Cleanup function
    return () => {
      video.removeEventListener('timeupdate', updateProgress)
      video.removeEventListener('loadedmetadata', updateProgress)
    }
  }, [preview, testingSpeed, source.customSpeedMin, source.customSpeedMax, videoSrc])

  // Cleanup when preview stops
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!preview) {
      video.pause()
      setProgress(0)
    }
  }, [preview])

  return (
    <Card 
      className="overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card border-border gap-1 p-0"
      onMouseEnter={() => setPreview(true)}
      onMouseLeave={() => setPreview(false)}
    >

      {/* Header with name, edit button, and enabled switch */}
      <CardHeader className="p-0 px-2 pb-0 pt-2">
        <div className="flex items-center justify-between gap-2">
  

          <div className="flex items-center gap-2 pl-2 flex-1 min-w-0">
            <Label 
              className="text-sm font-medium truncate flex-1"
                      title={source.title || source.clipSrc.split('/').pop()?.replace('.mp4', '') || ''}
      >
        {source.title || source.clipSrc.split('/').pop()?.replace('.mp4', '') || 'Untitled'}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
                        {/* <Label htmlFor={`enabled-${source.clipSrc}`} className="text-xs font-medium">Enabled</Label> */}
            <Switch
              id={`enabled-${source.clipSrc}`}
              checked={source.enabled !== false} 
              onCheckedChange={enabled => onUpdate({ enabled })} 
            />
          </div>
        </div>
        {/* {source.orientation && (
          <span className="text-xs text-muted-foreground">
            {source.width}×{source.height} • {source.orientation}
          </span>
        )} */}
      </CardHeader>

      
      {/* Compact thumbnail with preview */}
      <div className="w-full h-32 relative group">
        {preview ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/70 border-t border-black/50">
              <div 
                className="h-full bg-red-500 shadow-lg border-r border-red-300 transition-all duration-100 ease-linear"
                style={{ 
                  width: `${progress}%`,
                  boxShadow: '0 0 4px rgba(239, 68, 68, 0.8)' // Red glow for visibility
                }}
              />
            </div>
            {/* Mode indicator */}
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {source.mode === "bounce" ? 'Bounce' : 'Loop'}
            </div>
          </div>
                  ) : source.thumbnailSrc ? (
            <img src={source.thumbnailSrc} alt="thumbnail" className="w-full h-full object-cover" />
                    ) : (
            <video src={videoSrc} muted playsInline preload="metadata" className="w-full h-full object-cover" />
          )}
      </div>
      
      
      
      {/* Compact controls */}
      <CardContent className="p-3 pt-0 space-y-2">
        {/* Mode controls row */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 pt-2">
            <Label className="text-xs font-medium">Loop</Label>
            <Switch 
              id={`mode-${source.clipSrc}`}
              checked={source.mode === "bounce"} 
              onCheckedChange={handleModeToggle}
              className="bg-red-500 border-2 border-red-500"
            />
            <Label className="text-xs font-medium">Bounce</Label>
          </div>
        </div>
        
        {/* Speed controls - more compact */}
        <div className="space-y-2">
          {/* Speed Min */}
          <div 
            className={`flex items-center gap-2 p-2 rounded transition-all ${
              testingSpeed === 'min' ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : ''
            }`}
            onMouseEnter={() => setTestingSpeed('min')}
            onMouseLeave={() => setTestingSpeed(null)}
          >
            <Label className="text-xs font-medium w-12 shrink-0">Min</Label>
            <Slider
              value={[source.customSpeedMin || 0.5]}
              onValueChange={handleSpeedMinChange}
              min={0.1}
              max={1.0}
              step={0.01}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {(source.customSpeedMin || 0.5).toFixed(2)}×
            </span>
          </div>
          
          {/* Speed Max */}
          <div 
            className={`flex items-center gap-2 p-2 rounded transition-all ${
              testingSpeed === 'max' ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : ''
            }`}
            onMouseEnter={() => setTestingSpeed('max')}
            onMouseLeave={() => setTestingSpeed(null)}
          >
            <Label className="text-xs font-medium w-12 shrink-0">Max</Label>
            <Slider
              value={[source.customSpeedMax || 1.0]}
              onValueChange={handleSpeedMaxChange}
              min={0.5}
              max={3.0}
              step={0.01}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {(source.customSpeedMax || 1.0).toFixed(2)}×
            </span>
          </div>
        </div>
        

        
        {/* Tag selector */}
        <div className="pt-2 border-t">
          <TagSelector
            selectedTags={source.tags || []}
            onTagsChange={(tags) => onUpdate({ tags })}
            className="justify-between"
          />
        </div>
      </CardContent>

      {/* Edit Title Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl z-50">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Edit Title</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right text-gray-700 dark:text-gray-300">
                Title
              </Label>
              <Input
                id="title"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="col-span-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                placeholder="Enter title..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTitle()
                  } else if (e.key === 'Escape') {
                    handleCancelEdit()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancelEdit}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveTitle}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
