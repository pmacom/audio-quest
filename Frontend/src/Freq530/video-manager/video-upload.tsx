"use client"

import type React from "react"
import { useState, useRef } from "react"
import type { VideoFile, Directory, Tag } from "./types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadToPublicDirectory } from "@/app/manage/actions"

interface VideoUploadProps {
  directories: Directory[]
  tags: Tag[]
  selectedDirectory: string
  onSelectDirectory: (id: string) => void
  onAddVideo: (video: Omit<VideoFile, "id" | "createdAt">) => void
}

interface UploadFile {
  file: File
  progress: number
  status: "pending" | "uploading" | "completed" | "error"
  error?: string
  videoData?: Omit<VideoFile, "id" | "createdAt">
}

export function VideoUpload({ directories, tags, selectedDirectory, onSelectDirectory, onAddVideo }: VideoUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loop, setLoop] = useState(false)
  const [mirror, setMirror] = useState(false)
  const [uploadDestination, setUploadDestination] = useState<"local" | "spaces">("local")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const videoFiles = files.filter((file) => file.type.startsWith("video/"))

    const newUploadFiles: UploadFile[] = videoFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending",
    }))

    setUploadFiles((prev) => [...prev, ...newUploadFiles])
  }

  const handleTagToggle = (tagName: string, checked: boolean) => {
    if (checked) {
      setSelectedTags((prev) => [...prev, tagName])
    } else {
      setSelectedTags((prev) => prev.filter((t) => t !== tagName))
    }
  }

  const removeFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video")
      video.preload = "metadata"
      video.onloadedmetadata = () => {
        resolve(video.duration)
        URL.revokeObjectURL(video.src)
      }
      video.src = URL.createObjectURL(file)
    })
  }

  const uploadFileToServer = async (
    file: File,
    directoryPath: string,
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      // Update progress to show upload started
      setUploadFiles((prev) =>
        prev.map((uploadFile) =>
          uploadFile.file === file ? { ...uploadFile, progress: 10, status: "uploading" } : uploadFile,
        ),
      )

      // Create FormData
      const formData = new FormData()
      formData.append("file", file)
      formData.append("directoryPath", directoryPath)

      // Update progress to show form data prepared
      setUploadFiles((prev) =>
        prev.map((uploadFile) =>
          uploadFile.file === file ? { ...uploadFile, progress: 20, status: "uploading" } : uploadFile,
        ),
      )

      // Upload using server action
      const result = await uploadToPublicDirectory(formData)

      // Update progress based on result
      if (result.success && result.url) {
        setUploadFiles((prev) =>
          prev.map((uploadFile) =>
            uploadFile.file === file ? { ...uploadFile, progress: 100, status: "completed" } : uploadFile,
          ),
        )
        return { success: true, url: result.url }
      } else {
        setUploadFiles((prev) =>
          prev.map((uploadFile) =>
            uploadFile.file === file
              ? { ...uploadFile, progress: 0, status: "error", error: result.error }
              : uploadFile,
          ),
        )
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setUploadFiles((prev) =>
        prev.map((uploadFile) =>
          uploadFile.file === file ? { ...uploadFile, progress: 0, status: "error", error: errorMessage } : uploadFile,
        ),
      )
      return { success: false, error: errorMessage }
    }
  }

  const handleUpload = async () => {
    const currentDirectory = directories.find((d) => d.id === selectedDirectory)
    if (!currentDirectory) return

    for (let i = 0; i < uploadFiles.length; i++) {
      const uploadFile = uploadFiles[i]
      if (uploadFile.status !== "pending") continue

      try {
        setUploadFiles((prev) => prev.map((file, index) => (index === i ? { ...file, status: "uploading" } : file)))

        // Get the actual directory path
        const directoryPath = currentDirectory.path.startsWith("/")
          ? currentDirectory.path.substring(1) // Remove leading slash for server path
          : currentDirectory.path

        // Upload to server if local destination is selected
        let url = ""
        if (uploadDestination === "local") {
          const result = await uploadFileToServer(uploadFile.file, directoryPath)
          if (!result.success) {
            throw new Error(result.error || "Upload failed")
          }
          url = result.url || ""
        } else {
          // Simulate Digital Ocean Spaces upload (not implemented)
          // This would be replaced with actual DO Spaces API calls
          url = URL.createObjectURL(uploadFile.file)

          // Simulate upload progress
          let progress = 0
          const interval = setInterval(() => {
            progress += Math.random() * 20
            if (progress >= 100) {
              progress = 100
              clearInterval(interval)
            }
            setUploadFiles((prev) =>
              prev.map((file, idx) =>
                idx === i ? { ...file, progress, status: progress === 100 ? "completed" : "uploading" } : file,
              ),
            )
          }, 100)

          // Wait for "upload" to complete
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        const duration = await getVideoDuration(uploadFile.file)

        const videoData: Omit<VideoFile, "id" | "createdAt"> = {
          name: uploadFile.file.name,
          path: `${currentDirectory.path}/${uploadFile.file.name}`,
          directory: currentDirectory.path,
          url: uploadDestination === "local" ? url : URL.createObjectURL(uploadFile.file),
          loop,
          mirror,
          tags: selectedTags,
          size: uploadFile.file.size,
          duration,
        }

        setUploadFiles((prev) =>
          prev.map((file, index) => (index === i ? { ...file, videoData, status: "completed" } : file)),
        )

        onAddVideo(videoData)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setUploadFiles((prev) =>
          prev.map((file, index) => (index === i ? { ...file, status: "error", error: errorMessage } : file)),
        )
      }
    }
  }

  const clearCompleted = () => {
    setUploadFiles((prev) => prev.filter((file) => file.status !== "completed"))
  }

  const currentDirectory = directories.find((d) => d.id === selectedDirectory)

  return (
    <div className="space-y-6">
      {/* Upload Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Upload Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Destination Directory</Label>
              <Select value={selectedDirectory} onValueChange={onSelectDirectory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {directories.map((directory) => (
                    <SelectItem key={directory.id} value={directory.id}>
                      {directory.name} ({directory.path})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Upload Destination</Label>
              <Select
                value={uploadDestination}
                onValueChange={(value: "local" | "spaces") => setUploadDestination(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Directory (public/videos)</SelectItem>
                  <SelectItem value="spaces">Digital Ocean Spaces</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="loop" checked={loop} onCheckedChange={(checked) => setLoop(checked as boolean)} />
                <Label htmlFor="loop">Enable looping by default</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="mirror" checked={mirror} onCheckedChange={(checked) => setMirror(checked as boolean)} />
                <Label htmlFor="mirror">Enable mirror playback by default</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Default Tags</CardTitle>
            <CardDescription>Select tags to apply to all uploaded videos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`upload-tag-${tag.id}`}
                    checked={selectedTags.includes(tag.name)}
                    onCheckedChange={(checked) => handleTagToggle(tag.name, checked as boolean)}
                  />
                  <Label htmlFor={`upload-tag-${tag.id}`} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                    {tag.name}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Upload Area */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Upload Videos</CardTitle>
          <CardDescription>Select video files to upload to {currentDirectory?.name} directory</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Click to select video files</p>
            <p className="text-sm text-muted-foreground">Supports MP4, WebM, AVI, MOV and other video formats</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {uploadDestination === "spaces" && (
            <Alert>
              <AlertDescription>
                Digital Ocean Spaces integration requires environment variables to be configured. For now, files will be
                stored locally in the public directory.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upload Queue</CardTitle>
              <CardDescription>
                {uploadFiles.filter((f) => f.status === "completed").length} of {uploadFiles.length} files uploaded
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={clearCompleted} variant="outline" size="sm">
                Clear Completed
              </Button>
              <Button onClick={handleUpload} disabled={uploadFiles.every((f) => f.status !== "pending")}>
                Upload All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadFiles.map((uploadFile, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{uploadFile.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadFile.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="mt-2" />}
                    {uploadFile.status === "error" && (
                      <p className="text-sm text-destructive mt-1">{uploadFile.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadFile.status === "completed" && <Check className="h-5 w-5 text-green-500" />}
                    {uploadFile.status === "pending" && (
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
