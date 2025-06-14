
export interface VideoFile {
  id: string
  name: string
  path: string
  directory: string
  url: string
  thumbnail?: string
  loop: boolean
  mirror: boolean
  tags: string[]
  createdAt: Date
  size: number
  duration?: number
}

export interface Directory {
  id: string
  name: string
  path: string
  videoCount: number
}

export interface Tag {
  id: string
  name: string
  color: string // hex color (e.g., "#10b981")
}
