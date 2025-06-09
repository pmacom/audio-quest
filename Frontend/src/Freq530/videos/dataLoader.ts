import { VideoClipData, MaskClipData, VideoSourceEntry, MaskSourceEntry, adaptVideoClipToSource, adaptMaskClipToSource } from './types'

const STORAGE_KEY = "videoSourceSettings"

// Load and parse JSON data from public directory
async function loadVideoClips(): Promise<VideoClipData[]> {
  try {
    const response = await fetch('/data/segments.json')
    if (!response.ok) {
      throw new Error(`Failed to load segments.json: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading video clips:', error)
    return []
  }
}

async function loadMaskClips(): Promise<MaskClipData[]> {
  try {
    const response = await fetch('/data/masks.json')
    if (!response.ok) {
      throw new Error(`Failed to load masks.json: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading mask clips:', error)
    return []
  }
}

// Merge with localStorage settings
function mergeWithStoredSettings<T extends VideoSourceEntry | MaskSourceEntry>(
  sources: T[]
): T[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed: Record<string, { 
      mode?: "loop" | "bounce"; 
      enabled?: boolean;
      customSpeedMin?: number;
      customSpeedMax?: number;
      title?: string;
      tags?: string[];
      bounceSrc?: string;
      // Legacy support - remove these over time
      bounce?: boolean;
      isLooping?: boolean;
    }> = stored ? JSON.parse(stored) : {}
    
    return sources.map((source) => {
      const stored = parsed[source.clipSrc] || {}
      
      // Convert legacy boolean values to mode enum
      let mode = source.mode // Start with default from data file
      if (stored.mode) {
        mode = stored.mode // Use stored mode if available
      } else if (stored.bounce !== undefined || stored.isLooping !== undefined) {
        // Legacy conversion: bounce: true OR isLooping: false = "bounce" mode
        mode = (stored.bounce === true || stored.isLooping === false) ? "bounce" : "loop"
      }
      
      return {
        ...source,
        mode,
        enabled: stored.enabled !== undefined ? stored.enabled : source.enabled,
        customSpeedMin: stored.customSpeedMin || source.customSpeedMin,
        customSpeedMax: stored.customSpeedMax || source.customSpeedMax,
        title: stored.title || source.title,
        tags: stored.tags || source.tags,
        bounceSrc: stored.bounceSrc || source.bounceSrc,
      }
    })
  } catch (error) {
    console.error('Error loading localStorage settings:', error)
    return sources
  }
}

// Save settings to localStorage
export function saveSourceSettings(videos: VideoSourceEntry[], masks: MaskSourceEntry[]): void {
  try {
    const map: Record<string, { 
      mode: "loop" | "bounce"; 
      enabled?: boolean;
      customSpeedMin?: number;
      customSpeedMax?: number;
      title?: string;
      tags?: string[];
      bounceSrc?: string;
    }> = {}
    ;[...videos, ...masks].forEach(source => {
      map[source.clipSrc] = { 
        mode: source.mode, 
        enabled: source.enabled,
        customSpeedMin: source.customSpeedMin,
        customSpeedMax: source.customSpeedMax,
        title: source.title,
        tags: source.tags,
        bounceSrc: source.bounceSrc
      }
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch (error) {
    console.error('Error saving source settings:', error)
  }
}

// Main data loading functions
export async function loadVideoSources(): Promise<VideoSourceEntry[]> {
  const clips = await loadVideoClips()
  const sources = clips.map(adaptVideoClipToSource)
  return mergeWithStoredSettings(sources)
}

export async function loadMaskSources(): Promise<MaskSourceEntry[]> {
  const clips = await loadMaskClips()
  const sources = clips.map(adaptMaskClipToSource)
  return mergeWithStoredSettings(sources)
}

// Combined loader for both types
export async function loadAllSources(): Promise<{
  videos: VideoSourceEntry[]
  masks: MaskSourceEntry[]
}> {
  const [videos, masks] = await Promise.all([
    loadVideoSources(),
    loadMaskSources(),
  ])
  return { videos, masks }
}

// Hook-like loader with error handling
export async function loadSourcesWithFallback(): Promise<{
  videos: VideoSourceEntry[]
  masks: MaskSourceEntry[]
  hasErrors: boolean
}> {
  try {
    const { videos, masks } = await loadAllSources()
    return { videos, masks, hasErrors: false }
  } catch (error) {
    console.error('Failed to load sources, falling back to empty arrays:', error)
    return { videos: [], masks: [], hasErrors: true }
  }
} 