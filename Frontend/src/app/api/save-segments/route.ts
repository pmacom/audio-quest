import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Strip /files prefix from paths and merge custom speed values into base values
    const cleanedData = data.map((segment: any) => ({
      ...segment,
      clipSrc: segment.clipSrc?.replace(/^\/files\//, '') || segment.clipSrc,
      thumbnailSrc: segment.thumbnailSrc?.replace(/^\/files\//, '') || segment.thumbnailSrc,
      // ✅ FIX: Merge custom speed values into base speedMin/speedMax
      // This ensures user adjustments become the new defaults for amplitude-based control
      speedMin: segment.customSpeedMin || segment.speedMin,
      speedMax: segment.customSpeedMax || segment.speedMax,
      // Keep custom values for backwards compatibility
      customSpeedMin: segment.customSpeedMin || segment.speedMin,
      customSpeedMax: segment.customSpeedMax || segment.speedMax,
    }))
    
    // Write to the public/data/segments.json file
    const filePath = join(process.cwd(), 'public', 'data', 'segments.json')
    await writeFile(filePath, JSON.stringify(cleanedData, null, 2), 'utf8')
    
    return NextResponse.json({ success: true, message: 'Segments saved successfully' })
  } catch (error) {
    console.error('Error saving segments:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save segments' },
      { status: 500 }
    )
  }
} 