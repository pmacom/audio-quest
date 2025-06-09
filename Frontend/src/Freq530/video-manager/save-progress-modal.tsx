"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"

interface SaveProgressModalProps {
  isOpen: boolean
  onClose: () => void
  totalVideos: number
  processedVideos: number
  skippedVideos: number
  currentVideo?: string
  isComplete: boolean
  error?: string
}

export function SaveProgressModal({ 
  isOpen, 
  onClose, 
  totalVideos, 
  processedVideos, 
  skippedVideos,
  currentVideo,
  isComplete,
  error 
}: SaveProgressModalProps) {
  const [showComplete, setShowComplete] = useState(false)

  useEffect(() => {
    if (isComplete && !error) {
      // Show completion state for 2 seconds before closing
      setShowComplete(true)
      const timer = setTimeout(() => {
        onClose()
        setShowComplete(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isComplete, error, onClose])

  const progress = totalVideos > 0 ? (processedVideos / totalVideos) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {error ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                Save Failed
              </>
            ) : showComplete ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Save Complete!
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-blue-500" />
                Saving Changes...
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error ? (
            <div className="text-red-600">
              {error}
            </div>
          ) : showComplete ? (
            <div className="space-y-2">
              {totalVideos > 0 && (
                <div className="text-sm text-muted-foreground">
                  ✅ Processed {processedVideos} bounce videos
                  {skippedVideos > 0 && <> • Skipped {skippedVideos} existing videos</>}
                </div>
              )}
              <div className="text-green-600 font-medium">
                All changes saved successfully!
              </div>
            </div>
          ) : (
            <>
              {totalVideos > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Processing bounce videos...</span>
                    <span>{processedVideos} / {totalVideos}</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  {currentVideo && (
                    <div className="text-xs text-muted-foreground truncate">
                      Creating: {currentVideo}
                    </div>
                  )}
                  {skippedVideos > 0 && (
                    <div className="text-xs text-green-600">
                      Skipped {skippedVideos} existing videos
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                Saving data files...
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 