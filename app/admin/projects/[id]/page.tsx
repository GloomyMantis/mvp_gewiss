export const dynamic = 'force-dynamic'
import ProjectDetailClient from './ProjectDetailClient'

export async function generateStaticParams() {
  return []
}

export default function AdminProjectDetailPage({ params }: { params: { id: string } }) {
  return <ProjectDetailClient id={params.id} />
}
