import { redirect } from 'next/navigation'
import { ManageContent } from '../ManageContent'

interface Props {
  params: { section: string }
}

export default function Page({ params }: Props) {
  const section = params.section || 'segments'
  if (!['segments', 'masks', 'tags'].includes(section)) {
    redirect('/manage')
  }
  return <ManageContent section={section} />
}
