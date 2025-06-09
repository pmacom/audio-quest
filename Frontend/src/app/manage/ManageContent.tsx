"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { MediaManager } from "@/Freq530/video-manager/media-manager"
import { useTags } from "@/Freq530/video-manager/TagContext"
import './manage.css'

interface Props {
  section: string
}

export function ManageContent({ section }: Props) {
  const router = useRouter()
  const { tags, loading: tagsLoading, error: tagsError } = useTags()

  return (
    <div className="manage-dark-theme container mx-auto p-6 space-y-6 bg-background text-foreground min-h-screen">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Media Manager</h1>
        <p className="text-muted-foreground">
          Manage video segments, masks, and tags for your audio-visual experience
        </p>
      </div>

      <div className="w-full">
        <div className="flex space-x-1 rounded-lg p-1 grid grid-cols-3 bg-muted">
          <button 
            className={`px-3 py-1.5 text-sm font-medium transition-all rounded-md
              ${section === 'segments' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => router.push('/manage/segments')}
          >
            Segments
          </button>
          <button 
            className={`px-3 py-1.5 text-sm font-medium transition-all rounded-md
              ${section === 'masks' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => router.push('/manage/masks')}
          >
            Masks
          </button>
          <button 
            className={`px-3 py-1.5 text-sm font-medium transition-all rounded-md
              ${section === 'tags' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => router.push('/manage/tags')}
          >
            Tags
          </button>
        </div>

        {(section === 'segments' || section === 'masks') && (
          <div className="space-y-4">
            <MediaManager />
          </div>
        )}

        {section === 'tags' && (
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Tag Management</CardTitle>
                <CardDescription>
                  Create and manage tags for better organization of your media library
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tagsLoading ? (
                  <p className="text-muted-foreground">Loading tags...</p>
                ) : tagsError ? (
                  <p className="text-destructive">Error loading tags: {tagsError}</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Tags are loaded from /public/data/tags.json. Edit the file to modify tags.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center gap-2 p-2 border rounded">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm">{tag.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
                  )}
        </div>
      </div>
  )
}

