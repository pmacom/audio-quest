import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Write to the public/data/tags.json file
    const filePath = join(process.cwd(), 'public', 'data', 'tags.json')
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    
    return NextResponse.json({ success: true, message: 'Tags saved successfully' })
  } catch (error) {
    console.error('Error saving tags:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save tags' },
      { status: 500 }
    )
  }
} 