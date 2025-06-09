"use client"

import { createContext, useContext, ReactNode } from 'react'
import type { Tag } from './types'
import { useTagsFromJson } from '@/Freq530/videos/useTagsFromJson'

interface TagContextType {
  tags: Tag[]
  loading: boolean
  error: string | null
  getTagById: (id: string) => Tag | undefined
  getTagsByIds: (ids: string[]) => Tag[]
}

const TagContext = createContext<TagContextType | null>(null)

export function TagProvider({ children }: { children: ReactNode }) {
  const { tags, loading, error, getTagById, getTagsByIds } = useTagsFromJson()

  return (
    <TagContext.Provider value={{
      tags,
      loading,
      error,
      getTagById,
      getTagsByIds
    }}>
      {children}
    </TagContext.Provider>
  )
}

export function useTags() {
  const context = useContext(TagContext)
  if (!context) {
    throw new Error('useTags must be used within a TagProvider')
  }
  return context
} 