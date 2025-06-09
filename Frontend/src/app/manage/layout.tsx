import { TagProvider } from "@/Freq530/video-manager/TagContext"

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TagProvider>
      {children}
    </TagProvider>
  )
} 