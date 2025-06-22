"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Save, X, ArrowLeft } from "lucide-react"
import { VideoSourceEntry, MaskSourceEntry } from "@/Freq530/videos/types"
import { loadVideoSources, loadMaskSources, saveSourceSettings } from "@/Freq530/videos/dataLoader"
import { TagSelector } from "@/Freq530/video-manager/tag-selector"
import { WizardNavigation } from "./WizardNavigation"
import { VideoPreview } from "./VideoPreview"
import '../manage.css'

interface Props {
  type: "segments" | "masks"
  id: number
}

type ItemType = VideoSourceEntry | MaskSourceEntry

export function ItemWizard({ type, id }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<ItemType[]>([])
  const [currentItem, setCurrentItem] = useState<ItemType | null>(null)
  const [originalItem, setOriginalItem] = useState<ItemType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [testingSpeed, setTestingSpeed] = useState<'min' | 'max' | null>(null)
  const [previewSpeed, setPreviewSpeed] = useState<number | undefined>(undefined)

  // Load data based on type
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = type === "segments" 
        ? await loadVideoSources()
        : await loadMaskSources()
      
      setItems(data)
      
      if (id >= 0 && id < data.length) {
        const item = data[id]
        setCurrentItem(item)
        setOriginalItem(JSON.parse(JSON.stringify(item))) // Deep copy for comparison
      } else {
        setError(`Invalid ${type} ID: ${id}. Valid range: 0-${data.length - 1}`)
      }
    } catch (err) {
      console.error(`Failed to load ${type}:`, err)
      setError(`Failed to load ${type}`)
    } finally {
      setLoading(false)
    }
  }, [type, id])

  useEffect(() => {
    loadData()
  }, [loadData])



  // Check for changes whenever currentItem changes
  useEffect(() => {
    if (!currentItem || !originalItem) {
      setHasChanges(false)
      return
    }
    
    const hasChanges = JSON.stringify(currentItem) !== JSON.stringify(originalItem)
    setHasChanges(hasChanges)
  }, [currentItem, originalItem])

  // Handle item updates
  const handleUpdate = (updates: Partial<ItemType>) => {
    if (!currentItem) return
    
    setCurrentItem(prev => prev ? { ...prev, ...updates } : null)
  }

  // Handle save
  const handleSave = async () => {
    if (!currentItem || !hasChanges) return
    
    setSaving(true)
    try {
      // Update the items array with current changes
      const updatedItems = [...items]
      updatedItems[id] = currentItem
      setItems(updatedItems)
      
      // Save to storage
      if (type === "segments") {
        await saveSourceSettings(updatedItems as VideoSourceEntry[], [])
      } else {
        await saveSourceSettings([], updatedItems as MaskSourceEntry[])
      }
      
      // Update original item to reflect saved state
      setOriginalItem(JSON.parse(JSON.stringify(currentItem)))
      setHasChanges(false)
      
      console.log(`${type} saved successfully`)
    } catch (err) {
      console.error(`Failed to save ${type}:`, err)
      alert(`Failed to save ${type}. Please try again.`)
    } finally {
      setSaving(false)
    }
  }

  // Find next/previous uncompleted item
  const findNextUncompleted = (startId: number, direction: 'next' | 'prev'): number => {
    const increment = direction === 'next' ? 1 : -1
    let currentId = startId + increment
    
    // Loop through items to find next uncompleted
    while (currentId >= 0 && currentId < items.length) {
      const item = items[currentId]
      if (!item.completed) {
        return currentId
      }
      currentId += increment
    }
    
    // If no uncompleted found, return original next/prev
    return startId + increment
  }

  // Handle navigation
  const handleNavigate = (newId: number, preferUncompleted: boolean = false) => {
    if (hasChanges) {
      const shouldContinue = confirm("You have unsaved changes. Are you sure you want to navigate away?")
      if (!shouldContinue) return
    }
    
    let targetId = newId
    if (preferUncompleted) {
      const direction = newId > id ? 'next' : 'prev'
      const nextUncompleted = findNextUncompleted(id, direction)
      if (nextUncompleted >= 0 && nextUncompleted < items.length) {
        targetId = nextUncompleted
      }
    }
    
    router.push(`/manage/${type}/${targetId}`)
  }

  // Handle back to list
  const handleBackToList = () => {
    if (hasChanges) {
      const shouldContinue = confirm("You have unsaved changes. Are you sure you want to go back?")
      if (!shouldContinue) return
    }
    
    router.push(`/manage/${type}`)
  }

  // Handle speed changes with validation (original card style)
  const handleSpeedMinChange = (value: number[]) => {
    if (!currentItem) return
    
    const newMin = value[0]
    const currentMax = currentItem.customSpeedMax || 1.0
    
    if (newMin >= currentMax) {
      const adjustedMin = Math.max(0.2, currentMax - 0.1)
      handleUpdate({ 
        customSpeedMin: adjustedMin,
        customSpeedMax: currentMax 
      })
      // Update preview speed if currently hovering over min speed
      if (testingSpeed === 'min') {
        setPreviewSpeed(adjustedMin)
      }
    } else {
      handleUpdate({ customSpeedMin: newMin })
      // Update preview speed if currently hovering over min speed
      if (testingSpeed === 'min') {
        setPreviewSpeed(newMin)
      }
    }
  }
  
  const handleSpeedMaxChange = (value: number[]) => {
    if (!currentItem) return
    
    const newMax = value[0]
    const currentMin = currentItem.customSpeedMin || 0.5
    
    if (newMax <= currentMin) {
      const adjustedMax = Math.min(2.5, currentMin + 0.1)
      handleUpdate({ 
        customSpeedMin: currentMin,
        customSpeedMax: adjustedMax
      })
      // Update preview speed if currently hovering over max speed
      if (testingSpeed === 'max') {
        setPreviewSpeed(adjustedMax)
      }
    } else {
      handleUpdate({ customSpeedMax: newMax })
      // Update preview speed if currently hovering over max speed
      if (testingSpeed === 'max') {
        setPreviewSpeed(newMax)
      }
    }
  }

  // Handle mode toggle
  const handleModeToggle = (checked: boolean) => {
    handleUpdate({ mode: checked ? "bounce" : "loop" })
  }



  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading {type}...</p>
        </div>
      </div>
    )
  }

  if (error || !currentItem) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button 
            onClick={handleBackToList}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {type}
          </Button>
        </div>
      </div>
    )
  }

  const itemTitle = currentItem.title || currentItem.clipSrc.split('/').pop()?.replace('.mp4', '') || 'Untitled'

    return (
    <div className="manage-dark-theme container mx-auto max-w-[95vw] p-6 space-y-6 bg-background text-foreground min-h-screen">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBackToList}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {type}
          </Button>
          <div>
            <h1 className="text-2xl font-bold capitalize">{type} Wizard</h1>
            <p className="text-sm text-muted-foreground">
              {id + 1} of {items.length}: {itemTitle}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Edit title and status indicators */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Edit {type.slice(0, -1)}</span>
            {currentItem.completed && (
              <span className="text-green-600 font-medium">✓ Completed</span>
            )}
            {hasChanges && (
              <span className="text-orange-600 font-medium">• Unsaved Changes</span>
            )}
          </div>
          
          {/* Mark Complete toggle */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${
            currentItem.completed 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' 
              : 'bg-muted/50 border-border'
          }`}>
            <Switch
              checked={currentItem.completed === true}
              onCheckedChange={(completed) => handleUpdate({ completed })}
            />
            <Label className="text-sm font-medium">
              {currentItem.completed ? '✓ Completed' : 'Mark Complete'}
            </Label>
          </div>
          
          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`px-6 py-2 text-lg font-semibold transition-all ${
              hasChanges 
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {hasChanges ? 'Save Changes' : 'No Changes'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress indicator with completion stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-muted-foreground">
            {items.filter(item => item.completed).length} of {items.length} completed
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              currentItem.completed ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{ width: `${((id + 1) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Navigation */}
      <WizardNavigation
        currentId={id}
        totalItems={items.length}
        onNavigate={handleNavigate}
        hasChanges={hasChanges}
      />

      {/* Main content with visual change indicator */}
      <Card className={`transition-all duration-300 ${
        hasChanges 
          ? 'border-orange-500 border-2 shadow-lg shadow-orange-500/20' 
          : 'border-muted border'
      }`}>
        <CardContent className="p-6">
          {/* Side-by-side layout optimized for large video */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left side - Video preview (takes up 2/3 of space on xl screens) */}
            <div className="xl:col-span-2 space-y-4">
              <VideoPreview item={currentItem} previewSpeed={previewSpeed} />
            </div>
            
            {/* Right side - Controls (takes up 1/3 of space on xl screens) */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* Title editing */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                <Input
                  id="title"
                  value={currentItem.title || ''}
                  onChange={(e) => handleUpdate({ title: e.target.value })}
                  placeholder="Enter descriptive title..."
                  className="bg-background"
                />
              </div>

              {/* Mode controls row - original card style */}
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-2 pt-2">
                  <Label className="text-sm font-medium">Loop</Label>
                  <Switch 
                    checked={currentItem.mode === "bounce"} 
                    onCheckedChange={handleModeToggle}
                    className="bg-red-500 border-2 border-red-500"
                  />
                  <Label className="text-sm font-medium">Bounce</Label>
                </div>
              </div>
              
              {/* Speed controls - original card style */}
              <div className="space-y-2">
                {/* Speed Min */}
                <div 
                  className={`flex items-center gap-2 p-2 rounded transition-all ${
                    testingSpeed === 'min' ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : ''
                  }`}
                  onMouseEnter={() => {
                    setTestingSpeed('min')
                    setPreviewSpeed(currentItem.customSpeedMin || 0.5)
                  }}
                  onMouseLeave={() => {
                    setTestingSpeed(null)
                    setPreviewSpeed(undefined)
                  }}
                >
                  <Label className="text-sm font-medium w-12 shrink-0">Min</Label>
                  <Slider
                    value={[currentItem.customSpeedMin || 0.5]}
                    onValueChange={handleSpeedMinChange}
                    min={0.1}
                    max={1.0}
                    step={0.01}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-10 text-right">
                    {(currentItem.customSpeedMin || 0.5).toFixed(2)}×
                  </span>
                </div>
                
                {/* Speed Max */}
                <div 
                  className={`flex items-center gap-2 p-2 rounded transition-all ${
                    testingSpeed === 'max' ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : ''
                  }`}
                  onMouseEnter={() => {
                    setTestingSpeed('max')
                    setPreviewSpeed(currentItem.customSpeedMax || 1.0)
                  }}
                  onMouseLeave={() => {
                    setTestingSpeed(null)
                    setPreviewSpeed(undefined)
                  }}
                >
                  <Label className="text-sm font-medium w-12 shrink-0">Max</Label>
                  <Slider
                    value={[currentItem.customSpeedMax || 1.0]}
                    onValueChange={handleSpeedMaxChange}
                    min={0.5}
                    max={3.0}
                    step={0.01}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-10 text-right">
                    {(currentItem.customSpeedMax || 1.0).toFixed(2)}×
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-sm font-medium">Tags</Label>
                <TagSelector
                  selectedTags={currentItem.tags || []}
                  onTagsChange={(tags) => handleUpdate({ tags })}
                  className="justify-between"
                />
              </div>
              
              {/* Enabled toggle */}
              <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                <div className="flex flex-col">
                  <Label className="text-sm font-medium">Enabled in Rotation</Label>
                  <span className="text-xs text-muted-foreground">
                    Include this item in the active video rotation
                  </span>
                </div>
                <Switch
                  checked={currentItem.enabled !== false}
                  onCheckedChange={(enabled) => handleUpdate({ enabled })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 