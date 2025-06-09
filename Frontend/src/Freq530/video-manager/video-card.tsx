"use client"

import { useState } from "react"
import type { VideoFile, Tag } from "./types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Play, Trash2, Edit, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

interface VideoCardProps {
  video: VideoFile
  tags: Tag[]
  viewMode: "grid" | "list"
  onUpdate: (updates: Partial<VideoFile>) => void
  onDelete: () => void
  onPlay: () => void
}

export function VideoCard({ video, tags, viewMode, onUpdate, onDelete, onPlay }: VideoCardProps) {
  const isLocalFile = !video.url.startsWith("blob:")
  const storageType = isLocalFile ? "Local" : "Memory"
  const [preview, setPreview] = useState(false)

  return (
    <div className="p-2 border-2 border-red-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          
          PREVIEW THING

          hi
    
        </div>
      </div>
    </div>
  )
}

export function VideoCard2({ video, tags, viewMode, onUpdate, onDelete, onPlay }: VideoCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTags, setEditingTags] = useState<string[]>(video.tags)
  const [preview, setPreview] = useState(false)

  const handleTagToggle = (tagName: string, checked: boolean) => {
    if (checked) {
      setEditingTags((prev) => [...prev, tagName])
    } else {
      setEditingTags((prev) => prev.filter((t) => t !== tagName))
    }
  }

  const handleSaveEdit = () => {
    onUpdate({ tags: editingTags })
    setShowEditDialog(false)
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Determine if the video is stored locally or as a blob
  const isLocalFile = !video.url.startsWith("blob:")
  const storageType = isLocalFile ? "Local" : "Memory"

  if (viewMode === "list") {
    return (
      <Card className="border-2 border-red-200 flex items-center p-4 bg-white">
        <div className="w-32 h-20 mr-4 cursor-pointer" onClick={() => setPreview((p) => !p)}>
          {preview ? (
            <video
              src={video.url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : video.thumbnail ? (
            <img src={video.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
          ) : (
            <video src={video.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
          <div className="md:col-span-2">
            <h3 className="font-semibold truncate">{video.name}</h3>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(video.size)} • {formatDuration(video.duration)} • {storageType}
            </p>
          </div>

          <div className="flex flex-wrap gap-1">
            {video.tags.map((tagName) => {
              const tag = tags.find((t) => t.name === tagName)
              return (
                <Badge key={tagName} variant="secondary" className="text-xs">
                  <div className={`w-2 h-2 rounded-full ${tag?.color || "bg-gray-500"} mr-1`} />
                  {tagName}
                </Badge>
              )
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={video.loop}
                onCheckedChange={(checked) => onUpdate({ loop: checked })}
                id={`loop-${video.id}`}
              />
              <Label htmlFor={`loop-${video.id}`} className="text-xs">
                Loophmm
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={video.mirror}
                onCheckedChange={(checked) => onUpdate({ mirror: checked })}
                id={`mirror-${video.id}`}
              />
              <Label htmlFor={`mirror-${video.id}`} className="text-xs">
                Mirror
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={onPlay}>
              <Play className="h-4 w-4" />
            </Button>
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Video Tags</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={editingTags.includes(tag.name)}
                          onCheckedChange={(checked) => handleTagToggle(tag.name, checked as boolean)}
                        />
                        <Label htmlFor={`tag-${tag.id}`} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                          {tag.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit}>Save</Button>
                    <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden bg-white">
      <div className="w-full h-40 cursor-pointer" onClick={() => setPreview((p) => !p)}>
        {preview ? (
          <video
            src={video.url}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : video.thumbnail ? (
          <img src={video.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
        ) : (
          <video src={video.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
        )}
      </div>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold truncate flex-1">{video.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onPlay}>
                <Play className="h-4 w-4 mr-2" />
                Play
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {formatFileSize(video.size)} • {formatDuration(video.duration)} • {storageType}
          </div>

          <div className="flex flex-wrap gap-1">
            {video.tags.map((tagName) => {
              const tag = tags.find((t) => t.name === tagName)
              return (
                <Badge key={tagName} variant="secondary" className="text-xs">
                  <div className={`w-2 h-2 rounded-full ${tag?.color || "bg-gray-500"} mr-1`} />
                  {tagName}
                </Badge>
              )
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`loop-${video.id}`} className="text-sm">
                Loop
              </Label>
              <Switch
                checked={video.loop}
                onCheckedChange={(checked) => onUpdate({ loop: checked })}
                id={`loop-${video.id}`}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`mirror-${video.id}`} className="text-sm">
                Mirror
              </Label>
              <Switch
                checked={video.mirror}
                onCheckedChange={(checked) => onUpdate({ mirror: checked })}
                id={`mirror-${video.id}`}
              />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button onClick={onPlay} className="w-full">
          <Play className="h-4 w-4 mr-2" />
          Play Video
        </Button>
      </CardFooter>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={editingTags.includes(tag.name)}
                    onCheckedChange={(checked) => handleTagToggle(tag.name, checked as boolean)}
                  />
                  <Label htmlFor={`tag-${tag.id}`} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                    {tag.name}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit}>Save</Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
