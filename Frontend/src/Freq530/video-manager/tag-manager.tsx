"use client"

import { useState } from "react"
import type { Tag } from "./types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, TagIcon } from "lucide-react"

interface TagManagerProps {
  tags: Tag[]
  onAddTag: (name: string, color: string) => void
  onDeleteTag: (id: string) => void
}

const colorOptions = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Gray", value: "bg-gray-500" },
  { name: "Emerald", value: "bg-emerald-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Cyan", value: "bg-cyan-500" },
]

export function TagManager({ tags, onAddTag, onDeleteTag }: TagManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value)

  const handleAddTag = () => {
    if (!newTagName.trim()) return

    onAddTag(newTagName.trim(), selectedColor)
    setNewTagName("")
    setSelectedColor(colorOptions[0].value)
    setShowAddDialog(false)
  }

  const handleDeleteTag = (tag: Tag) => {
    if (confirm(`Are you sure you want to delete the "${tag.name}" tag? It will be removed from all videos.`)) {
      onDeleteTag(tag.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Video Tags</h3>
          <p className="text-sm text-muted-foreground">Create and manage tags for categorizing your videos</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tag-name">Tag Name</Label>
                <Input
                  id="tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g., Relaxing"
                />
              </div>
              <div>
                <Label>Tag Color</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-8 h-8 rounded-full ${color.value} border-2 ${
                        selectedColor === color.value ? "border-foreground" : "border-transparent"
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm">Preview:</span>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${selectedColor}`} />
                    {newTagName || "Tag Name"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddTag} disabled={!newTagName.trim()}>
                  Create Tag
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Current Tags</CardTitle>
          <CardDescription>{tags.length} tags available for video categorization</CardDescription>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center py-8">
              <TagIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tags created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag) => (
                <Card key={tag.id} className="p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${tag.color}`} />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTag(tag)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Tag Usage Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Use descriptive names that help you quickly identify video content</p>
          <p>• Choose distinct colors to make tags easily recognizable</p>
          <p>• Consider creating tags for mood, genre, quality, or usage purpose</p>
          <p>• Tags can be applied to multiple videos and help with filtering and organization</p>
        </CardContent>
      </Card>
    </div>
  )
}
