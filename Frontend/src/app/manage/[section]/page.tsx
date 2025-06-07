import { redirect } from 'next/navigation'
import { ManageContent } from '../ManageContent'

interface Props {
  params: { section: string }
}

export default function Page({ params }: Props) {
  const section = params.section || 'videos'
  if (!['videos', 'directories', 'tags', 'sources'].includes(section)) {
    redirect('/manage/videos')
  }
  return <ManageContent section={section} />
}
