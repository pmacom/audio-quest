"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SourceCard } from "./source-card"
import { VideoSourceEntry, MaskSourceEntry } from "@/Freq530/videos/types"
import { loadAllSources, saveSourceSettings } from "@/Freq530/videos/dataLoader"

export function SourceManager() {
  const [videos, setVideos] = useState<VideoSourceEntry[]>([])
  const [masks, setMasks] = useState<MaskSourceEntry[]>([])
  const [visibleVideos, setVisibleVideos] = useState(12)
  const [visibleMasks, setVisibleMasks] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load sources from new JSON files
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const { videos: loadedVideos, masks: loadedMasks } = await loadAllSources()
        setVideos(loadedVideos)
        setMasks(loadedMasks)
      } catch (err) {
        console.error('Failed to load sources:', err)
        setError('Failed to load video sources')
        setVideos([])
        setMasks([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Save to localStorage whenever flags change
  useEffect(() => {
    if (videos.length > 0 || masks.length > 0) {
      saveSourceSettings(videos, masks)
    }
  }, [videos, masks])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-muted-foreground">Loading video sources...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Videos</CardTitle>
          <CardDescription>Preview and toggle bounce mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {videos.slice(0, visibleVideos).map((video, idx) => (
              <SourceCard
                key={video.src}
                source={video}
                onUpdate={updates =>
                  setVideos(list =>
                    list.map((v, i) => (i === idx ? { ...v, ...updates } : v)),
                  )
                }
              />
            ))}
            {visibleVideos < videos.length && (
              <button
                className="col-span-2 md:col-span-4 text-sm underline"
                onClick={() =>
                  setVisibleVideos(v => Math.min(v + 12, videos.length))
                }
              >
                Load more
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Masks</CardTitle>
          <CardDescription>Preview and toggle bounce mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                className="col-span-2 md:col-span-4 text-sm underline"
                onClick={() =>
                  setVisibleMasks(v => Math.min(v + 12, masks.length))
                }
              >
                Load more
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
