"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  currentId: number
  totalItems: number
  onNavigate: (id: number, preferUncompleted?: boolean) => void
  hasChanges: boolean
}

export function WizardNavigation({ currentId, totalItems, onNavigate, hasChanges }: Props) {
  const hasPrevious = currentId > 0
  const hasNext = currentId < totalItems - 1

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigate(currentId - 1, true) // Prefer uncompleted
    }
  }

  const handleNext = () => {
    if (hasNext) {
      onNavigate(currentId + 1, true) // Prefer uncompleted
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-background border rounded-lg shadow-sm">
      {/* Previous Navigation */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handlePrevious}
          disabled={!hasPrevious}
          variant="default"
          size="default"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Uncompleted
        </Button>
        <Button
          onClick={() => onNavigate(currentId - 1, false)}
          disabled={!hasPrevious}
          variant="outline"
          size="sm"
          className="text-xs"
          title="Go to previous item (completed or not)"
        >
          Prev
        </Button>
      </div>

      {/* Position indicator - enhanced */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-semibold text-primary">
          {currentId + 1} of {totalItems}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Item Navigation</span>
          {hasChanges && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              Unsaved
            </span>
          )}
        </div>
      </div>

      {/* Next Navigation */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => onNavigate(currentId + 1, false)}
          disabled={!hasNext}
          variant="outline"
          size="sm"
          className="text-xs"
          title="Go to next item (completed or not)"
        >
          Next
        </Button>
        <Button
          onClick={handleNext}
          disabled={!hasNext}
          variant="default"
          size="default"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
        >
          Next Uncompleted
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 