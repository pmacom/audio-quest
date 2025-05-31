import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Plus, Minus, Settings, RefreshCw } from "lucide-react"

interface UniformRangeProps {
  min: number
  max: number
  value: number
  onChange: (values: number[]) => void
  disabled?: boolean
}

export const UniformRange: React.FC<UniformRangeProps> = ({
  min,
  max,
  value,
  onChange,
  disabled = false,
}) => {
  // Arrr, state for the visible window o' the slider!
  const [viewMinRange, setViewMinRange] = useState(min)
  const [viewMaxRange, setViewMaxRange] = useState(max)
  const [zoom, setZoom] = useState(1)
  const [values, setValues] = useState([min, value, max])
  const [editing, setEditing] = useState(false)
  const [formValues, setFormValues] = useState({ min, value, max, zoom })

  // Arrr, recalculate view range when the window changes
  const viewRange = useMemo(() => viewMaxRange - viewMinRange, [viewMinRange, viewMaxRange])

  const [settingHover, setSettingHover] = useState(false)

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const updateThumb = useCallback((index: number, newValue: number) => {
    setValues(prev => {
      const next = [...prev]
      next[index] = Math.max(
        index === 0 ? viewMinRange : prev[index - 1],
        Math.min(index === 2 ? viewMaxRange : prev[index + 1], newValue)
      )
      onChange(next)
      return next
    })
  }, [onChange, viewMinRange, viewMaxRange])

  const zoomDelta = 0.2

  const handleZoomIn = () => {
    // Shrink the view window, matey!
    const newRange = viewRange / (1 + zoomDelta)
    const mid = (viewMinRange + viewMaxRange) / 2
    setViewMinRange(mid - newRange / 2)
    setViewMaxRange(mid + newRange / 2)
  }

  const handleZoomOut = () => {
    // Expand the view window, arrr!
    const newRange = viewRange * (1 + zoomDelta)
    const mid = (viewMinRange + viewMaxRange) / 2
    setViewMinRange(mid - newRange / 2)
    setViewMaxRange(mid + newRange / 2)
  }

  const percentFromValue = (val: number) => ((val - viewMinRange) / (viewMaxRange - viewMinRange)) * 100

  const [minThumb, midThumb, maxThumb] = values.map(percentFromValue)

  const wrapperClasses = cn(
    "relative w-full h-10 overflow-hidden",
    // "border-2 border-red-500"
  )

  const handleFormSubmit = () => {
    // Arrr, recalculate the view window based on the new form values!
    const newMin = formValues.min
    const newMax = formValues.max
    const newContentRange = newMax - newMin
    const mid = (newMin + newMax) / 2
    const viewRange = newContentRange * formValues.zoom
    const newViewMinRange = mid - viewRange / 2
    const newViewMaxRange = mid + viewRange / 2

    setViewMinRange(newViewMinRange)
    setViewMaxRange(newViewMaxRange)
    setZoom(formValues.zoom)
    // Update values with new min, value, max
    const newValues = [formValues.min, (newContentRange/2)+formValues.min, formValues.max]
    setValues(newValues)
    onChange(newValues)
    setEditing(false)
  }

  const handleRefreshView = () => {
    // Arrr, reset the view window to current min/max and zoom!
    const contentRange = values[2] - values[0]
    const mid = (values[0] + values[2]) / 2
    const viewRange = contentRange * zoom
    const newViewMinRange = mid - viewRange / 2
    const newViewMaxRange = mid + viewRange / 2
    setViewMinRange(newViewMinRange)
    setViewMaxRange(newViewMaxRange)
  }

  // Synchronize internal state with props
  useEffect(() => {
    setValues([min, value, max]);
  }, [min, value, max]);

  return (
    <div ref={wrapperRef} className={wrapperClasses}>
      {editing && !disabled && (
        <RangeForm
          formValues={formValues}
          setFormValues={setFormValues}
          handleFormSubmit={handleFormSubmit}
        />
      )}

      <div className="absolute top-0 bottom-0 z-0 h-[70%] mt-[.5rem]" style={{ left: `${minThumb}%`, width: `${midThumb - minThumb}%`, background: "linear-gradient(to right, transparent, orange)" }} />
      <div className="absolute top-0 bottom-0 z-0 h-[70%] mt-[.5rem]" style={{ left: `${midThumb}%`, width: `${maxThumb - midThumb}%`, background: "linear-gradient(to right, orange, transparent)" }} />

      {values.map((v, i) => (
        <Thumb
          key={i}
          index={i}
          value={v}
          isCenter={i === 1}
          viewminRange={viewMinRange}
          viewmaxRange={viewMaxRange}
          onUpdate={updateThumb}
          parentRef={wrapperRef}
          disabled={disabled}
        />
      ))}

      {/* {min < viewMinRange && (
        <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-start pl-1 text-xs text-red-500 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none">
          ← offscreen
        </div>
      )}

      {max > viewMaxRange && (
        <div className="absolute right-0 top-0 bottom-0 w-6 flex items-center justify-end pr-1 text-xs text-red-500 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none">
          offscreen →
        </div>
      )} */}

      <div className="absolute top-0 right-0 flex z-20 text-white">
        {settingHover && !disabled && (
          <>
            <button
              onClick={handleZoomIn}
              className="rounded-l-full p-1 bg-white/20 border border-gray-300/20"
              onMouseEnter={() => setSettingHover(true)}
              onMouseLeave={() => setSettingHover(false)}
            >
              <Minus className="w-2 h-2" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 bg-white/20 border border-gray-300/20 border-l-0"
              onMouseEnter={() => setSettingHover(true)}
              onMouseLeave={() => setSettingHover(false)}
            >
              <Plus className="w-2 h-2" />
            </button>
            <button
              onClick={handleRefreshView}
              className="p-1 bg-white/20 border border-gray-300/20 border-l-0"
              onMouseEnter={() => setSettingHover(true)}
              onMouseLeave={() => setSettingHover(false)}
            >
              <RefreshCw className="w-2 h-2" />
            </button>
          </>
        )}
        <button
          onClick={() => !disabled && setEditing(e => !e)}
          className={`rounded-r-full p-1 bg-white/20 border border-gray-300/20 border-l-0 ${!settingHover ? "rounded-full" : ""}`}
          onMouseEnter={() => !disabled && setSettingHover(true)}
          onMouseLeave={() => !disabled && setSettingHover(false)}
        >
          <Settings className="w-2 h-2" />
        </button>
      </div>
    </div>
  )
}

interface ThumbProps {
  index: number
  value: number
  viewminRange: number
  viewmaxRange: number
  onUpdate: (index: number, value: number) => void
  parentRef: React.RefObject<HTMLDivElement | null>
  isCenter?: boolean
  disabled?: boolean
}

const Thumb: React.FC<ThumbProps> = ({
  index,
  value,
  viewminRange,
  viewmaxRange,
  onUpdate,
  parentRef,
  isCenter = false,
  disabled = false,
}) => {
  const [dragging, setDragging] = useState(false)

  const percent = ((value - viewminRange) / (viewmaxRange - viewminRange)) * 100

  const onMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    setDragging(true)
  }

  useEffect(() => {
    if (disabled) return
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging || !parentRef.current) return

      const rect = parentRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = x / rect.width
      const newVal = viewminRange + percent * (viewmaxRange - viewminRange)

      onUpdate(index, newVal)
    }

    const onMouseUp = () => setDragging(false)

    if (dragging) {
      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("mouseup", onMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [dragging, index, onUpdate, parentRef, viewminRange, viewmaxRange, disabled])

  return (
    <div
      className={cn(
        "absolute top-0 h-10 cursor-ew-resize z-10 flex items-center justify-center",
        isCenter ? "w-3 bg-orange-500" : "w-4 text-orange-500",
        disabled ? "pointer-events-none opacity-60" : ""
      )}
      style={{ left: `${percent}%`, transform: "translateX(-50%)" }}
      onMouseDown={onMouseDown}
    >
      {!isCenter && <RangeEnd reverse={index === 0} />}
      {isCenter && (
        <div className="absolute text-xs text-orange-800 bg-white px-1 rounded whitespace-nowrap">
          {value.toFixed(3)}
        </div>
      )}
    </div>
  )
}

export const RangeEnd = ({ reverse }: { reverse: boolean }) => {
  const classes = cn( 
    "text-orange-800",
    "border-2 border-orange-800",
    "h-[80%] w-2",
    "absolute text-xs px-1 rounded whitespace-nowrap",
    reverse ? "border-r-0" : "border-l-0"
  )
  return (
    <div className={classes}>
      {/* {reverse ? "[" : "]"} */}
    </div>
  )
} 

interface RangeFormProps {
  formValues: {
    min: number
    value: number
    max: number
    zoom: number
  },
  setFormValues: (values: { min: number, value: number, max: number, zoom: number }) => void,
  handleFormSubmit: () => void
}

export const RangeForm = ({ formValues, setFormValues, handleFormSubmit }: RangeFormProps) => {

  return (
  <div className="bg-purple-500 absolute inset-0 z-30 flex items-center justify-between gap-1 px-2 animate-fade-in text-xs">
    <div className="flex grow gap-1 items-center">
      <input type="number" className="w-[50%] px-1 py-0.5 pl-5 border rounded" value={formValues.min} onChange={e => setFormValues({ ...formValues, min: parseFloat(e.target.value) })} />
      <input type="number" className="w-[50%] px-1 py-0.5 pl-5 border rounded" value={formValues.max} onChange={e => setFormValues({ ...formValues, max: parseFloat(e.target.value) })} />
    </div>
    <button onClick={handleFormSubmit} className="h-7 px-2 bg-orange-500 text-white rounded">Go</button>
  </div>
  )
}