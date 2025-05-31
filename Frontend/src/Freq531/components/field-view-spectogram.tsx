import { useEffect, useRef } from 'react'
import { ColorSwatch } from '../types'

export const FieldViewSpectogram = ({
  value,
  width = 500,
  height = 300,
}: {
  value: Uint8Array | ArrayBuffer | null | undefined
  width?: number
  height?: number
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!value) return

    const byteArray = value instanceof Uint8Array ? value : new Uint8Array(value)
    // Debug: Log the first 16 bytes
    console.log('Spectrogram PNG first 16 bytes:', Array.from(byteArray.slice(0, 16)))

    const blob = new Blob([byteArray], { type: 'image/png' })
    const url = URL.createObjectURL(blob)

    // Debug: Open the PNG in a new tab for manual inspection
    window.open(url, '_blank')

    const img = new window.Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)
        }
      }
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      console.error('Failed to load spectrogram image')
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [value, width, height])

  return <canvas ref={canvasRef} width={width} height={height} style={{ background: '#111', display: 'block' }} />
}