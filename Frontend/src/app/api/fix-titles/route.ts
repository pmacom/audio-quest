import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

function generateTitleFromFilename(clipSrc: string): string {
  // Extract filename from path (remove /files/ prefix and extension)
  const filename = clipSrc.replace(/^\/files\//, '').replace(/^videos\/(segments|masks)\//, '').replace(/\.mp4$/, '')
  
  // Convert underscore to spaces and capitalize each word
  return filename
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json() // 'segments', 'masks', or 'both'
    
    const filesToProcess = []
    
    if (type === 'segments' || type === 'both') {
      filesToProcess.push({
        path: join(process.cwd(), 'public', 'data', 'segments.json'),
        name: 'segments'
      })
    }
    
    if (type === 'masks' || type === 'both') {
      filesToProcess.push({
        path: join(process.cwd(), 'public', 'data', 'masks.json'),
        name: 'masks'
      })
    }
    
    let processedCount = 0
    
    for (const file of filesToProcess) {
      try {
        const data = JSON.parse(await readFile(file.path, 'utf8'))
        
        const updatedData = data.map((item: any) => ({
          ...item,
          title: generateTitleFromFilename(item.clipSrc)
        }))
        
        await writeFile(file.path, JSON.stringify(updatedData, null, 2), 'utf8')
        processedCount += updatedData.length
        
        console.log(`Updated ${updatedData.length} titles in ${file.name}.json`)
      } catch (error) {
        console.error(`Error processing ${file.name}.json:`, error)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${processedCount} titles successfully`,
      processedCount 
    })
  } catch (error) {
    console.error('Error fixing titles:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fix titles' },
      { status: 500 }
    )
  }
} 