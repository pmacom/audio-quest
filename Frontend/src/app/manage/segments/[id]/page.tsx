import { ItemWizard } from '../../components/ItemWizard'

interface Props {
  params: { id: string }
}

export default function SegmentPage({ params }: Props) {
  const id = parseInt(params.id)
  
  if (isNaN(id)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid Segment ID</h1>
          <p className="text-muted-foreground mt-2">Please provide a valid numeric ID.</p>
        </div>
      </div>
    )
  }

  return <ItemWizard type="segments" id={id} />
} 