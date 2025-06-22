// Import Tag interface from video-manager
export type { Tag } from "@/Freq530/video-manager/types"

// New schema types from preprocessed JSON
export type VideoMode = "loop" | "bounce"

export interface VideoClipData {
  clipType: "segments"
  length: number
  frames: number
  mode: VideoMode
  orientation: "landscape" | "portrait" | "square"
  width: number
  height: number
  ratio: [number, number]
  speedMin: number
  speedMax: number
  thumbnailSrc: string
  clipSrc: string
  bounceSrc?: string // Path to bounce video if it exists
  enabled?: boolean
  title?: string
  tags?: string[] // Array of tag IDs
  bounceProcessed?: boolean // Flag indicating if bounce video has been created
}

export interface MaskClipData {
  clipType: "masks"
  length: number
  frames: number
  mode: VideoMode
  orientation: "landscape" | "portrait" | "square"
  width: number
  height: number
  ratio: [number, number]
  speedMin: number
  speedMax: number
  thumbnailSrc: string
  clipSrc: string
  bounceSrc?: string // Path to bounce video if it exists
  enabled?: boolean
  title?: string
  tags?: string[] // Array of tag IDs
  bounceProcessed?: boolean // Flag indicating if bounce video has been created
}

// Legacy compatibility types (what components currently expect)
export interface VideoSourceEntry {
  clipSrc: string
  bounceSrc?: string // Path to bounce video if it exists
  mode: VideoMode // "loop" or "bounce"
  enabled?: boolean
  thumbnailSrc?: string
  title?: string
  // Extended with new metadata
  orientation?: "landscape" | "portrait" | "square"
  width?: number
  height?: number
  ratio?: [number, number]
  length?: number
  frames?: number
  speedMin?: number
  speedMax?: number
  // User customizable settings
  customSpeedMin?: number  // Custom speed min (0.2 - 1.0)
  customSpeedMax?: number  // Custom speed max (0.5 - 2.5)
  tags?: string[] // Array of tag IDs
  bounceProcessed?: boolean // Flag indicating if bounce video has been created
  completed?: boolean // Flag indicating if editing is completed
}

export interface MaskSourceEntry {
  clipSrc: string
  bounceSrc?: string // Path to bounce video if it exists
  mode: VideoMode // "loop" or "bounce"
  enabled?: boolean
  thumbnailSrc?: string
  title?: string
  // Extended with new metadata
  orientation?: "landscape" | "portrait" | "square"
  width?: number
  height?: number
  ratio?: [number, number]
  length?: number
  frames?: number
  speedMin?: number
  speedMax?: number
  // User customizable settings
  customSpeedMin?: number  // Custom speed min (0.2 - 1.0)
  customSpeedMax?: number  // Custom speed max (0.5 - 2.5)
  tags?: string[] // Array of tag IDs
  bounceProcessed?: boolean // Flag indicating if bounce video has been created
  completed?: boolean // Flag indicating if editing is completed
}

// Adapter functions to convert new schema to legacy format
export function adaptVideoClipToSource(clip: VideoClipData): VideoSourceEntry {
  return {
    clipSrc: `/files/${clip.clipSrc}`,
    bounceSrc: clip.bounceSrc ? `/files/${clip.bounceSrc}` : undefined,
    thumbnailSrc: `/files/${clip.thumbnailSrc}`,
    mode: clip.mode, // Use mode from data file
    enabled: clip.enabled !== undefined ? clip.enabled : true, // Use from data or default to true
    title: clip.title || clip.clipSrc.split('/').pop()?.replace('.mp4', ''), // Use custom title or generate from filename
    orientation: clip.orientation,
    width: clip.width,
    height: clip.height,
    ratio: clip.ratio,
    length: clip.length,
    frames: clip.frames,
    speedMin: clip.speedMin,
    speedMax: clip.speedMax,
    // User customizable defaults
    customSpeedMin: clip.speedMin || 0.5, // Use original or default
    customSpeedMax: clip.speedMax || 1.0, // Use original or default
    tags: clip.tags || [], // Use tags from data or empty array
    bounceProcessed: clip.bounceProcessed,
  }
}

export function adaptMaskClipToSource(clip: MaskClipData): MaskSourceEntry {
  return {
    clipSrc: `/files/${clip.clipSrc}`,
    bounceSrc: clip.bounceSrc ? `/files/${clip.bounceSrc}` : undefined,
    thumbnailSrc: `/files/${clip.thumbnailSrc}`,
    mode: clip.mode, // Use mode from data file
    enabled: clip.enabled !== undefined ? clip.enabled : true, // Use from data or default to true
    title: clip.title || clip.clipSrc.split('/').pop()?.replace('.mp4', ''), // Use custom title or generate from filename
    orientation: clip.orientation,
    width: clip.width,
    height: clip.height,
    ratio: clip.ratio,
    length: clip.length,
    frames: clip.frames,
    speedMin: clip.speedMin,
    speedMax: clip.speedMax,
    // User customizable defaults
    customSpeedMin: clip.speedMin || 0.5, // Use original or default
    customSpeedMax: clip.speedMax || 1.0, // Use original or default
    tags: clip.tags || [], // Use tags from data or empty array
    bounceProcessed: clip.bounceProcessed,
  }
} 