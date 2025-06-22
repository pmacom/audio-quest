"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trash2 } from "lucide-react"
import { VideoSourceEntry, MaskSourceEntry } from "@/Freq530/videos/types"
import { loadVideoSources, loadMaskSources } from "@/Freq530/videos/dataLoader"
import { SourceCard } from "./source-card"
import { SaveManager } from "./save-manager"
import { saveSourceSettings } from "@/Freq530/videos/dataLoader"

export function MediaManager() {
  const [segments, setSegments] = useState<VideoSourceEntry[]>([])
  const [masks, setMasks] = useState<MaskSourceEntry[]>([])
  const [visibleSegments, setVisibleSegments] = useState(12)
  const [visibleMasks, setVisibleMasks] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fixingTitles, setFixingTitles] = useState(false)

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const [loadedSegments, loadedMasks] = await Promise.all([
          loadVideoSources(),
          loadMaskSources()
        ])
        setSegments(loadedSegments)
        setMasks(loadedMasks)
      } catch (err) {
        console.error('Failed to load media data:', err)
        setError('Failed to load media data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (segments.length > 0 || masks.length > 0) {
      saveSourceSettings(segments, masks)
    }
  }, [segments, masks])

  const handleSaveComplete = () => {
    // Optionally reload data after save to ensure consistency
    console.log('Save completed successfully')
  }

  const handleFixTitles = async () => {
    setFixingTitles(true)
    try {
      const response = await fetch('/api/fix-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'both' }),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Titles fixed successfully:', result.message)
        
        // Reload data to show updated titles
        const [loadedSegments, loadedMasks] = await Promise.all([
          loadVideoSources(),
          loadMaskSources()
        ])
        setSegments(loadedSegments)
        setMasks(loadedMasks)
        
        alert(`Fixed ${result.processedCount} titles successfully!`)
      } else {
        throw new Error('Failed to fix titles')
      }
    } catch (error) {
      console.error('Error fixing titles:', error)
      alert('Failed to fix titles. Please try again.')
    } finally {
      setFixingTitles(false)
    }
  }

  const handleClearStorage = () => {
    localStorage.removeItem('videoSourceSettings')
    console.log('Cleared videoSourceSettings from localStorage')
    
    // Reload data to show fresh data from JSON
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Loading media manager...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Media Manager</CardTitle>
              <CardDescription>
                Manage video segments and masks with preview thumbnails, bounce mode, and enable/disable controls
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleClearStorage}
                variant="outline"
                size="sm"
                title="Clear browser storage and refresh"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Storage
              </Button>
              <Button
                onClick={handleFixTitles}
                disabled={fixingTitles}
                variant="outline"
                size="sm"
              >
                {fixingTitles ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Fix Titles
                  </>
                )}
              </Button>
              <SaveManager
                segments={segments}
                masks={masks}
                onSaveComplete={handleSaveComplete}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="segments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="segments">Video Segments</TabsTrigger>
              <TabsTrigger value="masks">Video Masks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="segments" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {segments.slice(0, visibleSegments).map((segment, idx) => (
                  <SourceCard
                    key={segment.clipSrc}
                    source={segment}
                    index={idx}
                    type="segments"
                    onUpdate={updates =>
                      setSegments(list =>
                        list.map((s, i) => (i === idx ? { ...s, ...updates } : s)),
                      )
                    }
                  />
                ))}
                {visibleSegments < segments.length && (
                  <button
                    className="col-span-2 md:col-span-4 text-sm underline text-primary hover:text-primary/80"
                    onClick={() =>
                      setVisibleSegments(v => Math.min(v + 12, segments.length))
                    }
                  >
                    Load more ({segments.length - visibleSegments} remaining)
                  </button>
                )}
              </div>
              {segments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No video segments found. Check that segments.json exists in /public/data/
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="masks" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {masks.slice(0, visibleMasks).map((mask, idx) => (
                  <SourceCard
                    key={mask.clipSrc}
                    source={mask}
                    index={idx}
                    type="masks"
                    onUpdate={updates =>
                      setMasks(list =>
                        list.map((m, i) => (i === idx ? { ...m, ...updates } : m)),
                      )
                    }
                  />
                ))}
                {visibleMasks < masks.length && (
                  <button
                    className="col-span-2 md:col-span-4 text-sm underline text-primary hover:text-primary/80"
                    onClick={() =>
                      setVisibleMasks(v => Math.min(v + 12, masks.length))
                    }
                  >
                    Load more ({masks.length - visibleMasks} remaining)
                  </button>
                )}
              </div>
              {masks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No masks found. Check that masks.json exists in /public/data/
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 