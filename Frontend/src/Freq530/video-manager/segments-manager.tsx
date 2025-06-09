"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SourceCard } from "./source-card"
import { VideoSourceEntry } from "@/Freq530/videos/types"
import { loadVideoSources, saveSourceSettings } from "@/Freq530/videos/dataLoader"

interface SegmentsManagerProps {
  segments?: VideoSourceEntry[]
  onSegmentsChange?: (segments: VideoSourceEntry[]) => void
}

export function SegmentsManager({ segments: propSegments, onSegmentsChange }: SegmentsManagerProps = {}) {
  const [segments, setSegments] = useState<VideoSourceEntry[]>([])
  const [visibleSegments, setVisibleSegments] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use prop segments if provided, otherwise load from JSON
  useEffect(() => {
    if (propSegments) {
      setSegments(propSegments)
      setLoading(false)
      return
    }

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const loadedSegments = await loadVideoSources()
        setSegments(loadedSegments)
      } catch (err) {
        console.error('Failed to load segments:', err)
        setError('Failed to load video segments')
        setSegments([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [propSegments])

  // Save to localStorage whenever flags change (only if not using props)
  useEffect(() => {
    if (segments.length > 0) {
      // If using prop-based management, notify parent instead of localStorage
      if (onSegmentsChange) {
        onSegmentsChange(segments)
        return
      }

      // Load current masks to avoid clearing their settings
      async function saveWithMasks() {
        try {
          const { loadMaskSources } = await import("@/Freq530/videos/dataLoader")
          const currentMasks = await loadMaskSources()
          saveSourceSettings(segments, currentMasks)
        } catch (error) {
          console.warn('Could not load masks for persistence, saving segments only:', error)
          saveSourceSettings(segments, [])
        }
      }
      saveWithMasks()
    }
  }, [segments, onSegmentsChange])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Loading segments...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Video Segments</CardTitle>
          <CardDescription>
            Manage video segments with preview thumbnails, bounce mode, and enable/disable controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {segments.slice(0, visibleSegments).map((segment, idx) => (
              <SourceCard
                key={segment.src}
                source={segment}
                onUpdate={updates =>
                  setSegments(list =>
                    list.map((s, i) => (i === idx ? { ...s, ...updates } : s)),
                  )
                }
              />
            ))}
            {visibleSegments < segments.length && (
              <button
                className="col-span-2 md:col-span-4 text-sm underline text-primary hover:text-primary/80"
                onClick={() =>
                  setVisibleSegments(v => Math.min(v + 12, segments.length))
                }
              >
                Load more ({segments.length - visibleSegments} remaining)
              </button>
            )}
          </div>
          {segments.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No video segments found. Check that segments.json exists in /public/data/
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 