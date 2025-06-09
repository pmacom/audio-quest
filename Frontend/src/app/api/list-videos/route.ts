import { readdir, stat, access } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

async function collect(dir: string, baseUrl: string, res: string[] = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    const relPath = path.join(baseUrl, entry.name)
    if (entry.isDirectory()) {
      await collect(full, relPath, res)
    } else if (/\.(mp4|webm|mov|mkv)$/i.test(entry.name)) {
      res.push(relPath.replace(/\\/g, '/'))
    }
  }
  return res
}

export async function GET() {
  const candidates = [
    path.join(process.cwd(), 'public', 'videos'),
    path.join(process.cwd(), 'Frontend', 'public', 'videos'),
  ]

  let videoDir: string | null = null
  for (const p of candidates) {
    try {
      await access(p)
      videoDir = p
      break
    } catch {}
  }

  if (!videoDir) {
    return NextResponse.json({ videos: [] })
  }

  const files = await collect(videoDir, '/videos')
  const results = await Promise.all(
    files.map(async (p) => {
      const stats = await stat(path.join(videoDir!, p.replace(/^\/videos\//, '')))
      return { path: p, name: path.basename(p), size: stats.size }
    })
  )
  return NextResponse.json({ videos: results })
}
