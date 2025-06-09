export const VIDMAN_formatDuration = (seconds?: number) => {
  if (!seconds) return "Unknown"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}