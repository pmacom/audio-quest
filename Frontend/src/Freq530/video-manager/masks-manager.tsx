"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SourceCard } from "./source-card"
import { MaskSourceEntry } from "@/Freq530/videos/types"
import { loadMaskSources, saveSourceSettings } from "@/Freq530/videos/dataLoader"

interface MasksManagerProps {
  masks?: MaskSourceEntry[]
  onMasksChange?: (masks: MaskSourceEntry[]) => void
}

export function MasksManager({ masks: propMasks, onMasksChange }: MasksManagerProps = {}) {
  const [masks, setMasks] = useState<MaskSourceEntry[]>([])
  const [visibleMasks, setVisibleMasks] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use prop masks if provided, otherwise load from JSON
  useEffect(() => {
    if (propMasks) {
      setMasks(propMasks)
      setLoading(false)
      return
    }

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const loadedMasks = await loadMaskSources()
        setMasks(loadedMasks)
      } catch (err) {
        console.error('Failed to load masks:', err)
        setError('Failed to load masks')
        setMasks([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [propMasks])

  // Save to localStorage whenever flags change (only if not using props)
  useEffect(() => {
    if (masks.length > 0) {
      // If using prop-based management, notify parent instead of localStorage
      if (onMasksChange) {
        onMasksChange(masks)
        return
      }

      // Load current segments to avoid clearing their settings
      async function saveWithSegments() {
        try {
          const { loadVideoSources } = await import("@/Freq530/videos/dataLoader")
          const currentSegments = await loadVideoSources()
          saveSourceSettings(currentSegments, masks)
        } catch (error) {
          console.warn('Could not load segments for persistence, saving masks only:', error)
          saveSourceSettings([], masks)
        }
      }
      saveWithSegments()
    }
  }, [masks, onMasksChange])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Loading masks...</p>
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
          <CardTitle>Video Masks</CardTitle>
          <CardDescription>
            Manage mask overlays with preview thumbnails, bounce mode, and enable/disable controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {masks.slice(0, visibleMasks).map((mask, idx) => (
              <SourceCard
                key={mask.src}
                source={mask}
                onUpdate={updates =>
                  setMasks(list =>
                    list.map((m, i) => (i === idx ? { ...m, ...updates } : m)),
                  )
                }
              />
            ))}
            {visibleMasks < masks.length && (
              <button
                className="col-span-2 md:col-span-4 text-sm underline text-primary hover:text-primary/80"
                onClick={() =>
                  setVisibleMasks(v => Math.min(v + 12, masks.length))
                }
              >
                Load more ({masks.length - visibleMasks} remaining)
              </button>
            )}
          </div>
          {masks.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No masks found. Check that masks.json exists in /public/data/
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 