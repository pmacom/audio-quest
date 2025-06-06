"use client"

import { useEffect, useState } from "react"
import { VIDEO_SOURCES } from "@/Freq530/videos/videoList"
import { MASK_SOURCES } from "@/Freq530/videos/maskList"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface SourceEntry { src: string; bounce?: boolean }

const STORAGE_KEY = "source_bounce_map"

export function SourceManager() {
  const [videos, setVideos] = useState<SourceEntry[]>(VIDEO_SOURCES)
  const [masks, setMasks] = useState<SourceEntry[]>(MASK_SOURCES)
  const [visibleVideos, setVisibleVideos] = useState(12)
  const [visibleMasks, setVisibleMasks] = useState(12)

  // Load bounce settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: Record<string, boolean> = JSON.parse(stored)
      setVideos(vs => vs.map(v => ({ ...v, bounce: parsed[v.src] ?? v.bounce })))
      setMasks(ms => ms.map(m => ({ ...m, bounce: parsed[m.src] ?? m.bounce })))
    }
  }, [])

  // Save to localStorage whenever flags change
  useEffect(() => {
    const map: Record<string, boolean> = {}
    ;[...videos, ...masks].forEach(s => {
      if (s.bounce) map[s.src] = s.bounce
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  }, [videos, masks])

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
              <div key={video.src} className="space-y-2">
                <video
                  src={video.src}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-32 object-cover rounded"
                />
                <div className="flex items-center justify-between">
                  <Label htmlFor={`video-bounce-${idx}`}>Bounce</Label>
                  <Switch
                    id={`video-bounce-${idx}`}
                    checked={!!video.bounce}
                    onCheckedChange={checked =>
                      setVideos(list =>
                        list.map((v, i) =>
                          i === idx ? { ...v, bounce: checked } : v,
                        ),
                      )
                    }
                  />
                </div>
              </div>
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
              <div key={mask.src} className="space-y-2">
                <video
                  src={mask.src}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-32 object-cover rounded"
                />
                <div className="flex items-center justify-between">
                  <Label htmlFor={`mask-bounce-${idx}`}>Bounce</Label>
                  <Switch
                    id={`mask-bounce-${idx}`}
                    checked={!!mask.bounce}
                    onCheckedChange={checked =>
                      setMasks(list =>
                        list.map((m, i) =>
                          i === idx ? { ...m, bounce: checked } : m,
                        ),
                      )
                    }
                  />
                </div>
              </div>
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
