import { StatusBadge } from '../../../components/ui/StatusBadge'
import { getApiErrorMessage } from '../../../lib/apiError'
import { useServerConfig } from '../../server-config/hooks/useServerConfig'
import { useSonarrStatus } from '../../sonarr/hooks/useSonarrStatus'
import { formatBytes, healthTypeLabel } from '../../sonarr/lib/formatSeries'
import type { SonarrStatus } from '../../sonarr/services/types'

const HEALTH_TONE: Record<string, string> = { warning: 'text-warning', error: 'text-danger' }
const subheading = 'mb-2 text-[11px] font-medium uppercase tracking-wider text-text-subtle'

function HealthList({ health }: { health: SonarrStatus['health'] }) {
  if (health.length === 0) return <p className='text-sm text-text-muted'>Nenhum alerta</p>
  return (
    <ul className='space-y-1 text-sm'>
      {health.map((item, index) => (
        <li key={`${item.type}-${index}`} className='flex gap-2'>
          <span className={`shrink-0 font-medium ${HEALTH_TONE[item.type] ?? 'text-text-muted'}`}>{healthTypeLabel(item.type)}</span>
          <span className='text-text'>{item.message}</span>
        </li>
      ))}
    </ul>
  )
}

function StatusDetails({ data }: { data: SonarrStatus }) {
  return (
    <div className='space-y-4'>
      <dl className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm'>
        <div>
          <dt className='text-text-subtle'>Versão</dt>
          <dd className='font-mono text-text'>{data.version}</dd>
        </div>
        <div>
          <dt className='text-text-subtle'>Fila</dt>
          <dd className='font-mono text-text'>{data.queueCount}</dd>
        </div>
      </dl>
      <div>
        <h3 className={subheading}>Pastas raiz</h3>
        <ul className='space-y-1 text-sm'>
          {data.rootFolders.map((folder) => (
            <li key={folder.path} className='flex justify-between gap-4'>
              <span className='font-mono text-text'>{folder.path}</span>
              <span className='font-mono text-text-muted'>{`${formatBytes(folder.freeSpace)} livres`}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className={subheading}>Alertas</h3>
        <HealthList health={data.health} />
      </div>
    </div>
  )
}

/**
 * Sonarr health from the server; "Não configurado" when its env is absent.
 * @example <SonarrStatusSection />
 */
export function SonarrStatusSection() {
  const isConfigured = useServerConfig().data?.sonarr
  const { isPending, isSuccess, error, data } = useSonarrStatus(isConfigured === true)
  const status = isPending ? 'loading' : isSuccess ? 'online' : 'offline'

  return (
    <section className='space-y-5 rounded-lg border border-border bg-surface p-4 shadow-raised'>
      <h2 className='text-sm font-semibold text-text'>Sonarr</h2>
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
