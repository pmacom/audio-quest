"use client"

import { useEffect, useState } from "react"
import { VIDEO_SOURCES } from "@/Freq530/videos/videoList"
import { MASK_SOURCES } from "@/Freq530/videos/maskList"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface SourceEntry {
  src: string
  thumbnail?: string
  bounce?: boolean
  enabled?: boolean
}

const STORAGE_KEY = "source_settings"

export function SourceManager() {
  const [videos, setVideos] = useState<SourceEntry[]>([])
  const [masks, setMasks] = useState<SourceEntry[]>([])
  const [visibleVideos, setVisibleVideos] = useState(12)
  const [visibleMasks, setVisibleMasks] = useState(12)

  // Load sources from JSON files and merge with stored settings
  useEffect(() => {
    async function load() {
      try {
        const [videoRes, maskRes] = await Promise.all([
          fetch('/video-data.json'),
          fetch('/mask-data.json'),
        ])
        const videoData: SourceEntry[] = await videoRes.json()
        const maskData: SourceEntry[] = await maskRes.json()
        const stored = localStorage.getItem(STORAGE_KEY)
        const parsed: Record<string, { bounce?: boolean; enabled?: boolean }> =
          stored ? JSON.parse(stored) : {}
        setVideos(
          videoData.map((v) => ({ ...v, ...(parsed[v.src] || {}) }))
        )
        setMasks(maskData.map((m) => ({ ...m, ...(parsed[m.src] || {}) })))
      } catch {
        // fallback to static lists
        const stored = localStorage.getItem(STORAGE_KEY)
        const parsed: Record<string, { bounce?: boolean; enabled?: boolean }> =
          stored ? JSON.parse(stored) : {}
        setVideos(VIDEO_SOURCES.map((v) => ({ ...v, ...(parsed[v.src] || {}) })))
        setMasks(MASK_SOURCES.map((m) => ({ ...m, ...(parsed[m.src] || {}) })))
      }
    }
    load()
  }, [])

  // Save to localStorage whenever flags change
  useEffect(() => {
    const map: Record<string, { bounce?: boolean; enabled?: boolean }> = {}
    ;[...videos, ...masks].forEach(s => {
      map[s.src] = { bounce: s.bounce, enabled: s.enabled }
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
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt="thumbnail"
                    className="w-full h-32 object-cover rounded"
                  />
                ) : (
                  <video
                    src={video.src}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-32 object-cover rounded"
                  />
                )}
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-1">
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
                  <div className="flex items-center space-x-1">
                    <Label htmlFor={`video-enabled-${idx}`}>Enabled</Label>
                    <Switch
                      id={`video-enabled-${idx}`}
                      checked={video.enabled !== false}
                      onCheckedChange={checked =>
                        setVideos(list =>
                          list.map((v, i) =>
                            i === idx ? { ...v, enabled: checked } : v,
                          ),
                        )
                      }
                    />
                  </div>
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
                {mask.thumbnail ? (
                  <img
                    src={mask.thumbnail}
                    alt="thumbnail"
                    className="w-full h-32 object-cover rounded"
                  />
                ) : (
                  <video
                    src={mask.src}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-32 object-cover rounded"
                  />
                )}
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-1">
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
                  <div className="flex items-center space-x-1">
                    <Label htmlFor={`mask-enabled-${idx}`}>Enabled</Label>
                    <Switch
                      id={`mask-enabled-${idx}`}
                      checked={mask.enabled !== false}
                      onCheckedChange={checked =>
                        setMasks(list =>
                          list.map((m, i) =>
                            i === idx ? { ...m, enabled: checked } : m,
                          ),
                        )
                      }
                    />
                  </div>
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
