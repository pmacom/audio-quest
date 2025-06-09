import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Strip /files prefix from paths and merge custom speed values into base values
    const cleanedData = data.map((mask: any) => ({
      ...mask,
      clipSrc: mask.clipSrc?.replace(/^\/files\//, '') || mask.clipSrc,
      thumbnailSrc: mask.thumbnailSrc?.replace(/^\/files\//, '') || mask.thumbnailSrc,
      // ✅ FIX: Merge custom speed values into base speedMin/speedMax
      // This ensures user adjustments become the new defaults for amplitude-based control
      speedMin: mask.customSpeedMin || mask.speedMin,
      speedMax: mask.customSpeedMax || mask.speedMax,
      // Keep custom values for backwards compatibility
      customSpeedMin: mask.customSpeedMin || mask.speedMin,
      customSpeedMax: mask.customSpeedMax || mask.speedMax,
    }))
    
    // Write to the public/data/masks.json file
    const filePath = join(process.cwd(), 'public', 'data', 'masks.json')
    await writeFile(filePath, JSON.stringify(cleanedData, null, 2), 'utf8')
    
    return NextResponse.json({ success: true, message: 'Masks saved successfully' })
  } catch (error) {
    console.error('Error saving masks:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save masks' },
      { status: 500 }
    )
  }
} 