"use client"

import { useState } from "react"
import type { VideoFile, Directory, Tag } from "./types"
import { VideoCard } from "./video-card"
import { VideoPlayer } from "./video-player"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Grid, List } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface VideoManagerProps {
  videos: VideoFile[]
  directories: Directory[]
  tags: Tag[]
  selectedDirectory: string
  onSelectDirectory: (id: string) => void
  onUpdateVideo: (id: string, updates: Partial<VideoFile>) => void
  onDeleteVideo: (id: string) => void
}

export function VideoManager({
  videos,
  directories,
  tags,
  selectedDirectory,
  onSelectDirectory,
  onUpdateVideo,
  onDeleteVideo,
}: VideoManagerProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTag, setFilterTag] = useState<string>("")
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !filterTag || video.tags.includes(filterTag)
    return matchesSearch && matchesTag
  })

  const currentDirectory = directories.find((d) => d.id === selectedDirectory)

  const handlePlayVideo = (video: VideoFile) => {
    setSelectedVideo(video)
    setShowPlayer(true)
  }

  return (
    <div className="space-y-4">
      {/* Directory Selector */}
      <div className="flex items-center gap-4">
        <Select value={selectedDirectory} onValueChange={onSelectDirectory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select directory" />
          </SelectTrigger>
          <SelectContent>
            {directories.map((directory) => (
              <SelectItem key={directory.id} value={directory.id}>
                {directory.name} ({directory.videoCount} videos)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline">{currentDirectory?.path || "/videos"}</Badge>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterTag} onValueChange={setFilterTag}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.name}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                  {tag.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video Grid/List */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12 bg-white">
          <p className="text-muted-foreground">
            {videos.length === 0
              ? "No videos uploaded yet. Go to the Upload tab to add some videos."
              : "No videos match your search criteria."}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-4"
          }
        >
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              tags={tags}
              viewMode={viewMode}
              onUpdate={(updates) => onUpdateVideo(video.id, updates)}
              onDelete={() => onDeleteVideo(video.id)}
              onPlay={() => handlePlayVideo(video)}
            />
          ))}
        </div>
      )}

      {/* Video Player Dialog */}
      <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.name}</DialogTitle>
          </DialogHeader>
          {selectedVideo && <VideoPlayer video={selectedVideo} onClose={() => setShowPlayer(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
