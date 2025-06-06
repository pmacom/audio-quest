"use client"

import { useState, useEffect } from "react"
import { VideoManager } from "@/Freq530/video-manager/video-manager"
import { DirectoryManager } from "@/Freq530/video-manager/directory-manager"
import { TagManager } from "@/Freq530/video-manager/tag-manager"
import { SourceManager } from "@/Freq530/video-manager/source-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag } from "@/Freq530/video-manager/types"
import { Directory } from "@/Freq530/video-manager/types"
import { VideoFile } from "@/Freq530/video-manager/types"
import { defaultTags } from "@/Freq530/video-manager/contstants"

export default function Home() {
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [directories, setDirectories] = useState<Directory[]>([
    { id: "1", name: "Main", path: "/videos", videoCount: 0 },
  ])
  const [tags, setTags] = useState<Tag[]>(defaultTags)
  const [selectedDirectory, setSelectedDirectory] = useState<string>("1")

  // Load videos from the public directory on mount
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem("videoManager_videos")
      const savedVideos: VideoFile[] = saved ? JSON.parse(saved) : []

      try {
        const res = await fetch("/api/list-videos")
        const data: { videos: { path: string; name: string; size: number }[] } =
          await res.json()
        const vids: VideoFile[] = data.videos.map((v) => {
          const existing = savedVideos.find((sv) => sv.path === v.path)
          return {
            id: v.path,
            name: v.name,
            path: v.path,
            directory: "/videos",
            url: v.path,
            loop: existing?.loop ?? false,
            mirror: existing?.mirror ?? false,
            tags: existing?.tags ?? [],
            createdAt: existing?.createdAt ? new Date(existing.createdAt) : new Date(),
            size: v.size,
            duration: existing?.duration,
          }
        })
        setVideos(vids)
        setDirectories((prev) =>
          prev.map((d) =>
            d.id === "1" ? { ...d, videoCount: vids.length } : d
          )
        )
        // video count already updated above
      } catch {
        // ignore errors
      }
    }
    load()
  }, [])

  // Save data to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("videoManager_videos", JSON.stringify(videos))
  }, [videos])

  useEffect(() => {
    localStorage.setItem("videoManager_directories", JSON.stringify(directories))
  }, [directories])

  useEffect(() => {
    localStorage.setItem("videoManager_tags", JSON.stringify(tags))
  }, [tags])


  const updateVideo = (id: string, updates: Partial<VideoFile>) => {
    setVideos((prev) => prev.map((video) => (video.id === id ? { ...video, ...updates } : video)))
  }

  const deleteVideo = (id: string) => {
    const video = videos.find((v) => v.id === id)
    if (video) {
      setVideos((prev) => prev.filter((v) => v.id !== id))

      // Update directory video count
      setDirectories((prev) =>
        prev.map((dir) =>
          dir.path === video.directory ? { ...dir, videoCount: Math.max(0, dir.videoCount - 1) } : dir,
        ),
      )
    }
  }

  const addDirectory = (name: string, path: string) => {
    const newDirectory: Directory = {
      id: Date.now().toString(),
      name,
      path,
      videoCount: 0,
    }
    setDirectories((prev) => [...prev, newDirectory])
  }

  const deleteDirectory = (id: string) => {
    const directory = directories.find((d) => d.id === id)
    if (directory) {
      // Remove all videos in this directory
      setVideos((prev) => prev.filter((video) => video.directory !== directory.path))
      setDirectories((prev) => prev.filter((d) => d.id !== id))

      // Reset selected directory if deleted
      if (selectedDirectory === id) {
        setSelectedDirectory(directories[0]?.id || "1")
      }
    }
  }

  const addTag = (name: string, color: string) => {
    const newTag: Tag = {
      id: Date.now().toString(),
      name,
      color,
    }
    setTags((prev) => [...prev, newTag])
  }

  const deleteTag = (id: string) => {
    const tag = tags.find((t) => t.id === id)
    if (tag) {
      // Remove tag from all videos
      setVideos((prev) =>
        prev.map((video) => ({
          ...video,
          tags: video.tags.filter((t) => t !== tag.name),
        })),
      )
      setTags((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const currentDirectory = directories.find((d) => d.id === selectedDirectory)
  const filteredVideos = videos.filter((video) => video.directory === currentDirectory?.path)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Video Manager</h1>
        <p className="text-muted-foreground">
          Upload, organize, and manage your video files with custom properties and tags
        </p>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="directories">Directories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Video Library</CardTitle>
              <CardDescription>Manage your video collection with custom properties and tags</CardDescription>
            </CardHeader>
            <CardContent>
              <VideoManager
                videos={filteredVideos}
                directories={directories}
                tags={tags}
                selectedDirectory={selectedDirectory}
                onSelectDirectory={setSelectedDirectory}
                onUpdateVideo={updateVideo}
                onDeleteVideo={deleteVideo}
              />
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="directories" className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Directory Management</CardTitle>
              <CardDescription>Create and manage video directories</CardDescription>
            </CardHeader>
            <CardContent>
              <DirectoryManager
                directories={directories}
                onAddDirectory={addDirectory}
                onDeleteDirectory={deleteDirectory}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Tag Management</CardTitle>
              <CardDescription>Create and manage video tags for better organization</CardDescription>
            </CardHeader>
            <CardContent>
              <TagManager tags={tags} onAddTag={addTag} onDeleteTag={deleteTag} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Source Bounce</CardTitle>
              <CardDescription>Configure bounce behavior for default sources</CardDescription>
            </CardHeader>
            <CardContent>
              <SourceManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
