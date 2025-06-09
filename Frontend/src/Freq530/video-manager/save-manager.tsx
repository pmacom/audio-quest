"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Save, CheckCircle } from "lucide-react"
import { VideoSourceEntry, MaskSourceEntry } from "@/Freq530/videos/types"
import { loadVideoSources, loadMaskSources } from "@/Freq530/videos/dataLoader"
import { SaveProgressModal } from "./save-progress-modal"

interface SaveManagerProps {
  segments: VideoSourceEntry[]
  masks: MaskSourceEntry[]
  onSaveComplete?: () => void
}

export function SaveManager({ segments, masks, onSaveComplete }: SaveManagerProps) {
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [originalData, setOriginalData] = useState<{
    segments: VideoSourceEntry[]
    masks: MaskSourceEntry[]
  }>({ segments: [], masks: [] })
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalState, setModalState] = useState({
    totalVideos: 0,
    processedVideos: 0,
    skippedVideos: 0,
    currentVideo: '',
    isComplete: false,
    error: ''
  })

  // Load original data to compare against
  useEffect(() => {
    async function loadOriginalData() {
      try {
        const [originalSegments, originalMasks] = await Promise.all([
          loadVideoSources(),
          loadMaskSources()
        ])
        setOriginalData({
          segments: originalSegments,
          masks: originalMasks
        })
      } catch (error) {
        console.error('Failed to load original data:', error)
      }
    }
    loadOriginalData()
  }, [])

  // Detect changes between current data and original data
  useEffect(() => {
    if (originalData.segments.length === 0 && originalData.masks.length === 0) return

    const segmentsChanged = JSON.stringify(segments) !== JSON.stringify(originalData.segments)
    const masksChanged = JSON.stringify(masks) !== JSON.stringify(originalData.masks)
    
    setHasChanges(segmentsChanged || masksChanged)
  }, [segments, masks, originalData])

  // Helper function to check if bounce video already exists
  const checkBounceVideoExists = async (clipSrc: string): Promise<boolean> => {
    try {
      // Remove /files/ prefix if present
      const cleanClipSrc = clipSrc.startsWith('/files/') ? clipSrc.substring(7) : clipSrc
      const pathParts = cleanClipSrc.split('/')
      const filename = pathParts[pathParts.length - 1]
      const directory = pathParts.slice(0, -1).join('/')
      const bounceFilename = `bounce_${filename}`
      const bounceVideoPath = `/files/${directory}/${bounceFilename}`
      
      console.log(`Checking if bounce video exists: ${bounceVideoPath}`)
      const response = await fetch(bounceVideoPath, { method: 'HEAD' })
      const exists = response.ok
      console.log(`Bounce video ${bounceVideoPath} exists: ${exists}`)
      return exists
    } catch (error) {
      console.log(`Error checking bounce video existence:`, error)
      return false
    }
  }

  const resetModalState = () => {
    setModalState({
      totalVideos: 0,
      processedVideos: 0,
      skippedVideos: 0,
      currentVideo: '',
      isComplete: false,
      error: ''
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setShowModal(true)
    resetModalState()
    
    try {
      // Step 1: Process bounce videos for any videos marked with mode="bounce"
      const bounceSegments = segments.filter(segment => segment.mode === "bounce")
      const bounceMasks = masks.filter(mask => mask.mode === "bounce")
      
      console.log(`Found ${bounceSegments.length} segments and ${bounceMasks.length} masks marked for bounce`)
      
      // Filter out videos that already have bounce videos
      const segmentsNeedingBounce = []
      const masksNeedingBounce = []
      let skippedCount = 0
      
      for (const segment of bounceSegments) {
        if (await checkBounceVideoExists(segment.clipSrc)) {
          console.log(`Skipping bounce video creation for ${segment.clipSrc} - already exists`)
          skippedCount++
          continue
        }
        segmentsNeedingBounce.push(segment)
      }
      
      for (const mask of bounceMasks) {
        if (await checkBounceVideoExists(mask.clipSrc)) {
          console.log(`Skipping bounce video creation for ${mask.clipSrc} - already exists`)
          skippedCount++
          continue
        }
        masksNeedingBounce.push(mask)
      }
      
      const totalVideosToProcess = segmentsNeedingBounce.length + masksNeedingBounce.length
      
      console.log(`Bounce video summary:`)
      console.log(`  - Found: ${bounceSegments.length + bounceMasks.length} total bounce clips`)
      console.log(`  - Skipped: ${skippedCount} (already exist)`)
      console.log(`  - Processing: ${totalVideosToProcess} (${segmentsNeedingBounce.length} segments, ${masksNeedingBounce.length} masks)`)
      
      // Update modal state
      setModalState(prev => ({
        ...prev,
        totalVideos: totalVideosToProcess,
        skippedVideos: skippedCount
      }))
      
      let processedCount = 0
      
      // Process bounce videos for segments
      for (const segment of segmentsNeedingBounce) {
        const videoName = segment.title || segment.clipSrc.split('/').pop()?.replace('.mp4', '') || 'Unknown'
        setModalState(prev => ({
          ...prev,
          currentVideo: videoName
        }))
        
        console.log(`Creating bounce video for segment: ${segment.clipSrc}`)
        const response = await fetch('/api/create-bounce', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clipSrc: segment.clipSrc,
            clipType: 'segments',
            optimizationLevel: 'maximum' // Use maximum compression for file size optimization
          }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Failed to create bounce video for ${segment.clipSrc}: ${error.error}`)
        }
        
        const result = await response.json()
        console.log(`Bounce video processing result:`, result)
        
        processedCount++
        setModalState(prev => ({
          ...prev,
          processedVideos: processedCount
        }))
      }
      
      // Process bounce videos for masks
      for (const mask of masksNeedingBounce) {
        const videoName = mask.title || mask.clipSrc.split('/').pop()?.replace('.mp4', '') || 'Unknown'
        setModalState(prev => ({
          ...prev,
          currentVideo: videoName
        }))
        
        console.log(`Creating bounce video for mask: ${mask.clipSrc}`)
        const response = await fetch('/api/create-bounce', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clipSrc: mask.clipSrc,
            clipType: 'masks',
            optimizationLevel: 'maximum' // Use maximum compression for file size optimization
          }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Failed to create bounce video for ${mask.clipSrc}: ${error.error}`)
        }
        
        const result = await response.json()
        console.log(`Bounce video processing result:`, result)
        
        processedCount++
        setModalState(prev => ({
          ...prev,
          processedVideos: processedCount
        }))
      }

      // Step 2: Save segments if they've changed
      if (JSON.stringify(segments) !== JSON.stringify(originalData.segments)) {
        const response = await fetch('/api/save-segments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(segments),
        })
        if (!response.ok) throw new Error('Failed to save segments')
      }

      // Step 3: Save masks if they've changed
      if (JSON.stringify(masks) !== JSON.stringify(originalData.masks)) {
        const response = await fetch('/api/save-masks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(masks),
        })
        if (!response.ok) throw new Error('Failed to save masks')
      }

      // Step 4: Clear localStorage after successful save
      localStorage.removeItem('videoSourceSettings')
      
      // Step 5: Update original data to reflect the new saved state
      setOriginalData({ segments, masks })
      setHasChanges(false)
      
      onSaveComplete?.()
      
      console.log('All changes saved successfully')
      
      // Show completion in modal
      setModalState(prev => ({
        ...prev,
        isComplete: true,
        currentVideo: ''
      }))
      
    } catch (error) {
      console.error('Error saving changes:', error)
      setModalState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isComplete: true
      }))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className={`transition-opacity duration-200 ${
          hasChanges ? 'opacity-100' : 'opacity-50'
        }`}
        variant={hasChanges ? "default" : "outline"}
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Saving...
          </>
        ) : hasChanges ? (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Saved
          </>
        )}
      </Button>
      
      <SaveProgressModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        totalVideos={modalState.totalVideos}
        processedVideos={modalState.processedVideos}
        skippedVideos={modalState.skippedVideos}
        currentVideo={modalState.currentVideo}
        isComplete={modalState.isComplete}
        error={modalState.error}
      />
    </>
  )
} 