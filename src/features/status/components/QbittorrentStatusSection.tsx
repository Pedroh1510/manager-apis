import { StatusBadge } from '../../../components/ui/StatusBadge'
import { getApiErrorMessage } from '../../../lib/apiError'
import { useServerConfig } from '../../server-config/hooks/useServerConfig'
import { useQbittorrentStatus } from '../../torrents/hooks/useQbittorrentStatus'
import { formatSpeed } from '../../torrents/lib/formatTorrent'
import type { QbittorrentStatus } from '../../torrents/services/types'

function StatusDetails({ data }: { data: QbittorrentStatus }) {
  const rows: [string, string][] = [
    ['Versão', data.version],
    ['API Version', data.apiVersion],
    ['Baixando', String(data.downloading)],
    ['Concluídos', String(data.completed)],
    ['Download', formatSpeed(data.downloadSpeed)],
    ['Upload', formatSpeed(data.uploadSpeed)],
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
 * qBittorrent health from the server; "Não configurado" when its env is absent.
 * @example <QbittorrentStatusSection />
 */
export function QbittorrentStatusSection() {
  const isConfigured = useServerConfig().data?.qbittorrent
  const { isPending, isSuccess, error, data } = useQbittorrentStatus(isConfigured === true)
  const status = isPending ? 'loading' : isSuccess ? 'online' : 'offline'

  return (
    <section className='space-y-5 rounded-lg border border-border bg-surface p-4 shadow-raised'>
      <h2 className='text-sm font-semibold text-text'>qBittorrent</h2>
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
