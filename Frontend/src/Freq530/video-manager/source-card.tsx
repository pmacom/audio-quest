"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface SourceEntry {
  src: string
  thumbnail?: string
  bounce?: boolean
  enabled?: boolean
}

interface Props {
  source: SourceEntry
  onUpdate: (updates: Partial<SourceEntry>) => void
}

export function SourceCard({ source, onUpdate }: Props) {
  const [preview, setPreview] = useState(false)

  return (
    <Card className="overflow-hidden bg-white">
      <div className="w-full h-40 cursor-pointer" onClick={() => setPreview(p => !p)}>
        {preview ? (
          <video
            src={source.src}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : source.thumbnail ? (
          <img src={source.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
        ) : (
          <video src={source.src} muted playsInline preload="metadata" className="w-full h-full object-cover" />
        )}
      </div>
      <CardHeader className="p-4">
        <h3 className="font-semibold truncate">{source.src.split('/').pop()}</h3>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bounce" className="text-sm">Bounce</Label>
          <Switch id="bounce" checked={!!source.bounce} onCheckedChange={c => onUpdate({ bounce: c })} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="enabled" className="text-sm">Enabled</Label>
          <Switch id="enabled" checked={source.enabled !== false} onCheckedChange={c => onUpdate({ enabled: c })} />
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  )
}
