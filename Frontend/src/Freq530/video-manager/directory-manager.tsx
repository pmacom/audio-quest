"use client"

import { useState } from "react"
import type { Directory } from "./types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Folder, Plus, Trash2, FolderOpen } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DirectoryManagerProps {
  directories: Directory[]
  onAddDirectory: (name: string, path: string) => void
  onDeleteDirectory: (id: string) => void
}

export function DirectoryManager({ directories, onAddDirectory, onDeleteDirectory }: DirectoryManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newDirName, setNewDirName] = useState("")
  const [newDirPath, setNewDirPath] = useState("")

  const handleAddDirectory = () => {
    if (!newDirName.trim() || !newDirPath.trim()) return

    // Ensure path starts with /
    const formattedPath = newDirPath.startsWith("/") ? newDirPath : `/${newDirPath}`

    onAddDirectory(newDirName.trim(), formattedPath)
    setNewDirName("")
    setNewDirPath("")
    setShowAddDialog(false)
  }

  const handleDeleteDirectory = (directory: Directory) => {
    if (directory.videoCount > 0) {
      if (
        !confirm(
          `This directory contains ${directory.videoCount} videos. Are you sure you want to delete it? All videos will be removed.`,
        )
      ) {
        return
      }
    }
    onDeleteDirectory(directory.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Video Directories</h3>
          <p className="text-sm text-muted-foreground">Manage directories for organizing your video files</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Directory
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Directory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dir-name">Directory Name</Label>
                <Input
                  id="dir-name"
                  value={newDirName}
                  onChange={(e) => setNewDirName(e.target.value)}
                  placeholder="e.g., Nature Videos"
                />
              </div>
              <div>
                <Label htmlFor="dir-path">Directory Path</Label>
                <Input
                  id="dir-path"
                  value={newDirPath}
                  onChange={(e) => setNewDirPath(e.target.value)}
                  placeholder="e.g., /videos/nature"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Path will be created relative to the public directory
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddDirectory} disabled={!newDirName.trim() || !newDirPath.trim()}>
                  Create Directory
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <FolderOpen className="h-4 w-4" />
        <AlertDescription>
          Directories will be created in your Next.js public folder. Make sure to add the video directories to your
          .gitignore file to avoid committing large video files to your repository.
        </AlertDescription>
      </Alert>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Current Directories</CardTitle>
          <CardDescription>{directories.length} directories configured</CardDescription>
        </CardHeader>
        <CardContent>
          {directories.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No directories created yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Videos</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directories.map((directory) => (
                  <TableRow key={directory.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        {directory.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{directory.path}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                        {directory.videoCount} videos
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDirectory(directory)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Git Configuration</CardTitle>
          <CardDescription>Recommended .gitignore entries for your video directories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm">
              # Video directories
              <br />
              {directories.map((dir) => (
                <span key={dir.id}>
                  public{dir.path}/<br />
                </span>
              ))}
              <br /># Video file extensions
              <br />
              *.mp4
              <br />
              *.avi
              <br />
              *.mov
              <br />
              *.webm
              <br />
              *.mkv
            </code>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Add these entries to your .gitignore file to prevent video files from being committed to your repository.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
