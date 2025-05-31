// FieldViewArray.tsx
import { useRef, useEffect } from 'react'
import { ColorSwatch } from '../types'
import { getSwatchColor } from '../utils'

export const FieldViewNumberArray = ({
  values,
  width = 100,
  height = 30,
  color,
}: {
  values: number[]
  width?: number
  height?: number
  color: ColorSwatch
}) => {

  return <div className="field-view-number-array w-full h-full pointer-events-none">{values.join(', ')}</div>


  // const ref = useRef<HTMLCanvasElement>(null)

  // useEffect(() => {
  //   const cvs = ref.current
  //   if (!cvs) return
  //   const ctx = cvs.getContext('2d')
  //   if (!ctx) return

  //   ctx.clearRect(0, 0, width, height)
  //   ctx.fillStyle = `var(${getSwatchColor(color)})`

  //   const n = values.length
  //   if (n === 0) return

  //   // draw little dots or line
  //   ctx.beginPath()
  //   values.forEach((v, i) => {
  //     const x = (i / (n - 1)) * width
  //     const y = (1 - Math.min(Math.max(v,0),1)) * height
  //     ctx.lineTo(x, y)
  //   })
  //   ctx.stroke()
  // }, [values, width, height, color])

  // return <canvas ref={ref} width={width} height={height} className="block" />
}
