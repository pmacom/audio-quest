import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { spawn } from 'child_process'

interface CreateBounceRequest {
  clipSrc: string
  clipType: 'segments' | 'masks'
  optimizationLevel?: 'fast' | 'balanced' | 'maximum' // Optional optimization level
}

// Optimization presets for different use cases
const OPTIMIZATION_PRESETS = {
  fast: {
    preset: 'fast',
    crf: 23,
    maxrate: '2M',
    fps: 30,
    tune: 'film'
  },
  balanced: {
    preset: 'medium',
    crf: 26,
    maxrate: '1.5M',
    fps: 24,
    tune: 'film'
  },
  maximum: {
    preset: 'veryslow',
    crf: 28,
    maxrate: '1M',
    fps: 20,
    tune: 'stillimage'
  }
}

// Helper function to run optimized ffmpeg command with configurable compression
function runFFmpeg(inputPath: string, outputPath: string, optimizationLevel: 'fast' | 'balanced' | 'maximum' = 'maximum'): Promise<void> {
  return new Promise((resolve, reject) => {
    const opts = OPTIMIZATION_PRESETS[optimizationLevel]
    console.log(`Creating bounce video with ${optimizationLevel} optimization: ${inputPath} -> ${outputPath}`)
    console.log(`Using settings: CRF=${opts.crf}, FPS=${opts.fps}, Maxrate=${opts.maxrate}, Preset=${opts.preset}`)
    
    // Optimized ffmpeg command with configurable settings
    const ffmpegArgs = [
      '-i', inputPath,
      
      // Create bounce video (original + reversed) with no audio
      '-filter_complex', '[0:v]reverse[r];[0:v][r]concat=n=2:v=1:a=0',
      
      // Video codec optimizations
      '-c:v', 'libx264',
      '-preset', opts.preset,
      '-crf', opts.crf.toString(),
      
      // Advanced encoding optimizations
      '-tune', opts.tune,
      '-profile:v', 'baseline', // Better compatibility and smaller files
      '-level', '3.1', // Compatibility level
      
      // Frame rate optimization
      '-r', opts.fps.toString(),
      
      // Bitrate control for consistent file sizes
      '-maxrate', opts.maxrate,
      '-bufsize', (parseInt(opts.maxrate) * 2).toString() + 'M', // 2x maxrate for buffer
      
      // Color space and format optimization
      '-pix_fmt', 'yuv420p', // Standard format, better compression
      
      // Web optimization and compatibility
      '-movflags', '+faststart', // Move metadata to beginning for web streaming
      
      // Strip all unnecessary data
      '-an', // No audio (explicit)
      '-map_metadata', '-1', // Remove all metadata
      '-map_chapters', '-1', // Remove chapters
      '-sn', // No subtitles
      
      // Additional compression techniques
      '-flags', '+global_header', // Better compatibility
      '-avoid_negative_ts', 'make_zero', // Timestamp optimization
      
      '-y', // Overwrite output file
      outputPath
    ]
    
    const ffmpeg = spawn('ffmpeg', ffmpegArgs)
    
    let stderr = ''
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`Successfully created bounce video: ${outputPath}`)
        resolve()
      } else {
        console.error(`FFmpeg failed with code ${code}:`, stderr)
        reject(new Error(`FFmpeg process failed with code ${code}: ${stderr}`))
      }
    })
    
    ffmpeg.on('error', (error) => {
      console.error('FFmpeg spawn error:', error)
      reject(error)
    })
  })
}

// Helper function to update JSON file with bounce video path
async function updateJsonWithBounceVideo(clipType: string, originalClipSrc: string, bounceClipSrc: string) {
  const publicDir = path.join(process.cwd(), 'public')
  const jsonPath = path.join(publicDir, 'data', `${clipType}.json`)
  
  try {
    const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
    
    // Find and update the entry
    const entryIndex = jsonData.findIndex((entry: any) => entry.clipSrc === originalClipSrc)
    if (entryIndex !== -1) {
      // Set bounceSrc to point to bounce video, preserve original clipSrc
      jsonData[entryIndex].bounceSrc = bounceClipSrc
      jsonData[entryIndex].bounceProcessed = true // Flag to indicate it's been processed
      
      await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2))
      console.log(`Updated ${clipType}.json with bounce video path in bounceSrc`)
      return true
    } else {
      console.warn(`Entry not found in ${clipType}.json for ${originalClipSrc}`)
      return false
    }
  } catch (error) {
    console.error(`Error updating ${clipType}.json:`, error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clipSrc, clipType, optimizationLevel = 'maximum' }: CreateBounceRequest = await request.json()
    
    if (!clipSrc || !clipType) {
      return NextResponse.json(
        { error: 'Missing clipSrc or clipType' },
        { status: 400 }
      )
    }
    
    // Remove /files/ prefix if present for file operations
    const cleanClipSrc = clipSrc.startsWith('/files/') ? clipSrc.substring(7) : clipSrc
    
    // Build file paths
    const publicDir = path.join(process.cwd(), 'public')
    const inputPath = path.join(publicDir, 'files', cleanClipSrc)
    
    // Create bounce filename by adding bounce_ prefix to the filename
    const pathParts = cleanClipSrc.split('/')
    const filename = pathParts[pathParts.length - 1]
    const directory = pathParts.slice(0, -1).join('/')
    const bounceFilename = `bounce_${filename}`
    const bounceClipSrc = `${directory}/${bounceFilename}`
    const outputPath = path.join(publicDir, 'files', bounceClipSrc)
    
    // Check if input file exists
    try {
      await fs.access(inputPath)
    } catch (error) {
      return NextResponse.json(
        { error: `Input video file not found: ${inputPath}` },
        { status: 404 }
      )
    }
    
    // Check if bounce video already exists
    try {
      await fs.access(outputPath)
      console.log(`Bounce video already exists: ${outputPath}`)
      
      // Update JSON to point to existing bounce video
      await updateJsonWithBounceVideo(clipType, cleanClipSrc, bounceClipSrc)
      
      return NextResponse.json({
        success: true,
        message: 'Bounce video already exists',
        originalClipSrc: cleanClipSrc,
        bounceClipSrc: bounceClipSrc
      })
    } catch (error) {
      // File doesn't exist, proceed with creation
    }
    
    // Create bounce video using ffmpeg with specified optimization level
    await runFFmpeg(inputPath, outputPath, optimizationLevel)
    
    // Update JSON file to point to bounce video
    await updateJsonWithBounceVideo(clipType, cleanClipSrc, bounceClipSrc)
    
    return NextResponse.json({
      success: true,
      message: 'Bounce video created successfully',
      originalClipSrc: cleanClipSrc,
      bounceClipSrc: bounceClipSrc
    })
    
  } catch (error) {
    console.error('Error creating bounce video:', error)
    return NextResponse.json(
      { error: `Failed to create bounce video: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 