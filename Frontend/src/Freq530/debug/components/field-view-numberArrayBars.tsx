// FieldViewArray.tsx
import { useRef, useEffect } from 'react'
import { ColorSwatch } from '../../types'
import { getSwatchColor } from '../../utils'

export const FieldViewNumberArrayBars = ({
  values,
  width = 500,
  height = 300,
  color,
}: {
  values: number[]
  width?: number
  height?: number
  color: ColorSwatch
}) => {
  const ref = useRef<HTMLCanvasElement>(null)
  // FOR DEBUGGING:return <div className="w-full text-right">{values[1]}</div>
  
  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    const n = values.length
    if (n === 0) return

    const barWidth = width / n
    const midY = height / 2

    for (let i = 0; i < n; i++) {
      const v = Math.max(0, Math.min(1, values[i] / 255)) // Scale and clamp
      const barHeight = v * (height / 2)
      ctx.fillStyle = `var(${getSwatchColor(color)})`
      // Draw upward bar
      ctx.fillRect(i * barWidth, midY - barHeight, barWidth - 1, barHeight)
      // Draw downward bar (mirrored)
      ctx.fillRect(i * barWidth, midY, barWidth - 1, barHeight)
    }

    // Draw center line
    ctx.strokeStyle = '#888'
    ctx.beginPath()
    ctx.moveTo(0, midY)
    ctx.lineTo(width, midY)
    ctx.stroke()

    // Draw border
    ctx.strokeStyle = '#333'
    ctx.strokeRect(0, 0, width, height)
  }, [values, width, height, color])

  return <canvas ref={ref} width={width} height={height} className="block" />
}
