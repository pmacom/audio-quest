"use client"

import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTags } from "./TagContext"
import { cn } from "@/lib/utils"

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  className?: string
}

export function TagSelector({ selectedTags, onTagsChange, className }: TagSelectorProps) {
  const { tags, loading, error } = useTags()
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)

  if (loading) {
    return (
      <div className={`flex gap-1 ${className || ''}`}>
        {/* Loading skeleton */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i}
            className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" 
          />
        ))}
      </div>
    )
  }

  if (error || tags.length === 0) {
    return null
  }

  const classes = cn({
    'flex justify-between': className?.includes('justify-between'),
    'gap-1': !className?.includes('justify-between'),
    'm-auto': true,
  })

  return (
    <TooltipProvider delayDuration={200}>
      <ToggleGroup
        type="multiple"
        value={selectedTags}
        onValueChange={onTagsChange}
        className={classes}
      >
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id)
          const isHovered = hoveredTag === tag.id
          const showColor = isSelected || isHovered
          const opacity = isSelected || isHovered ? 1 : 0.2
          
          return (
            <Tooltip key={tag.id}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={tag.id}
                  className="w-8 h-5 p-0 !rounded-full border-2 transition-all duration-200 data-[state=on]:border-gray-400"
                  style={{
                    backgroundColor: showColor ? tag.color : '#9CA3AF',
                    borderColor: isSelected ? '#6B7280' : 'transparent',
                    opacity: opacity
                  }}
                  onMouseEnter={() => setHoveredTag(tag.id)}
                  onMouseLeave={() => setHoveredTag(null)}
                  aria-label={`Toggle ${tag.name} tag`}
                >
                  <span className="sr-only">{tag.name}</span>
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="text-xs bg-black border border-gray-400 text-white shadow-lg z-50"
                sideOffset={5}
              >
                {tag.name}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </ToggleGroup>
    </TooltipProvider>
  )
} 