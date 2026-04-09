import { StatusBadge } from '../../../components/ui/StatusBadge'

interface ProjectStatus {
  label: string
  isLoading: boolean
  isSuccess: boolean
}

interface GlobalStatusSummaryProps {
  projects: ProjectStatus[]
}

export function GlobalStatusSummary({ projects }: GlobalStatusSummaryProps) {
  const anyLoading = projects.some(p => p.isLoading)
  const allOnline = !anyLoading && projects.every(p => p.isSuccess)
  const offlineCount = anyLoading ? 0 : projects.filter(p => !p.isSuccess).length

  const overallStatus = anyLoading ? 'loading' : allOnline ? 'online' : 'offline'
  const message = anyLoading
    ? null
    : allOnline
    ? 'Todos os sistemas operacionais'
    : `${offlineCount} sistema(s) com problema`

  return (
    <div className='mb-8 flex items-center gap-3'>
      <StatusBadge status={overallStatus} />
      {message && <span className='text-sm text-gray-600'>{message}</span>}
    </div>
  )
}
