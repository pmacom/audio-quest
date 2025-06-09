import { useState, useEffect } from 'react'
import { Tag } from '@/Freq530/video-manager/types'

export function useTagsFromJson() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTags() {
      try {
        setLoading(true)
        const response = await fetch('/data/tags.json')
        if (!response.ok) {
          throw new Error(`Failed to load tags: ${response.statusText}`)
        }
        const tagsData: Tag[] = await response.json()
        setTags(tagsData)
        setError(null)
      } catch (err) {
        console.error('Error loading tags:', err)
        setError(err instanceof Error ? err.message : 'Failed to load tags')
        setTags([])
      } finally {
        setLoading(false)
      }
    }

    loadTags()
  }, [])

  const getTagById = (id: string): Tag | undefined => {
    return tags.find(tag => tag.id === id)
  }

  const getTagsByIds = (ids: string[]): Tag[] => {
    return ids.map(id => getTagById(id)).filter(Boolean) as Tag[]
  }

  return {
    tags,
    loading,
    error,
    getTagById,
    getTagsByIds
  }
} 