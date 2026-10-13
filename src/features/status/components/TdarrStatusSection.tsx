import { StatusBadge } from '../../../components/ui/StatusBadge'
import { getApiErrorMessage } from '../../../lib/apiError'
import { useServerConfig } from '../../server-config/hooks/useServerConfig'
import { useTdarrOverview } from '../../tdarr/hooks/useTdarr'
import type { TdarrOverview } from '../../tdarr/services/types'

function StatusDetails({ data }: { data: TdarrOverview }) {
  const onlineNodes = data.nodes.filter((node) => node.online).length
  const busyWorkers = data.nodes.reduce((sum, node) => sum + node.busyWorkers, 0)
  const rows: [string, string][] = [
    ['Versão', data.version],
    ['Nodes online', `${onlineNodes}/${data.nodes.length}`],
    ['Workers ativos', String(busyWorkers)],
  ]
  return (
    <dl className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3'>
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className='text-text-subtle'>{label}</dt>
          <dd className='font-mono text-text'>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Tdarr health from the server; "Não configurado" when TDARR_URL is absent.
 * @example <TdarrStatusSection />
 */
export function TdarrStatusSection() {
  const isConfigured = useServerConfig().data?.tdarr
  const { isPending, isSuccess, error, data } = useTdarrOverview(isConfigured === true)
  const status = isPending ? 'loading' : isSuccess ? 'online' : 'offline'

  return (
    <section className='space-y-5 rounded-lg border border-border bg-surface p-4 shadow-raised'>
      <h2 className='text-sm font-semibold text-text'>Tdarr</h2>
      {isConfigured === false ? (
        <p className='text-sm text-text-muted'>Não configurado</p>
      ) : (
        <div className='flex items-center gap-3'>
          <span className='text-sm text-text-muted'>API:</span>
          <StatusBadge status={status} />
        </div>
      )}
      {error && <p className='text-sm text-danger'>{getApiErrorMessage(error)}</p>}
      {data && <StatusDetails data={data} />}
    </section>
  )
}
