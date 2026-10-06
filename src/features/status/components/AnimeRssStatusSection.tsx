import type { ReactNode } from 'react'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useAnimeStatus } from '../../anime-rss/hooks/useAnimeStatus'

/** API health card; `children` adds blocks such as queues or migrations below the details. */
export function AnimeRssStatusSection({ children }: { children?: ReactNode }) {
  const { isLoading, isSuccess, isError, data } = useAnimeStatus()
  const status = isLoading ? 'loading' : isSuccess ? 'online' : 'offline'
  const db = data?.database as Record<string, unknown> | undefined
  const qbt = data?.qbittorrent as Record<string, unknown> | undefined

  return (
    <section className='space-y-5 rounded-lg border border-border bg-surface p-4 shadow-raised'>
      <h2 className='text-sm font-semibold text-text'>Anime RSS</h2>
      <div className='flex items-center gap-3'>
        <span className='text-sm text-text-muted'>API:</span>
        <StatusBadge status={status} />
      </div>
      {isError && (
        <p className='text-sm text-danger'>
          Não foi possível conectar à API de RSS.
        </p>
      )}
      {isSuccess && data && (
        <div className='space-y-5'>
          <div>
            <h3 className='mb-2 text-[11px] font-medium uppercase tracking-wider text-text-subtle'>Database</h3>
            {db && 'error' in db ? (
              <p className='text-sm text-danger'>{String(db.error)}</p>
            ) : db ? (
              <dl className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3'>
                <div>
                  <dt className='text-text-subtle'>Versão</dt>
                  <dd className='font-mono text-text'>{String(db.version)}</dd>
                </div>
                <div>
                  <dt className='text-text-subtle'>Conexões máximas</dt>
                  <dd className='font-mono text-text'>{String(db.maxConnections)}</dd>
                </div>
                <div>
                  <dt className='text-text-subtle'>Conexões ativas</dt>
                  <dd className='font-mono text-text'>{String(db.activeConnections)}</dd>
                </div>
              </dl>
            ) : null}
          </div>
          <div>
            <h3 className='mb-2 text-[11px] font-medium uppercase tracking-wider text-text-subtle'>qBittorrent</h3>
            {qbt && 'error' in qbt ? (
              <p className='text-sm text-danger'>{String(qbt.error)}</p>
            ) : qbt ? (
              <dl className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3'>
                <div>
                  <dt className='text-text-subtle'>Versão</dt>
                  <dd className='font-mono text-text'>{String(qbt.version)}</dd>
                </div>
                <div>
                  <dt className='text-text-subtle'>API Version</dt>
                  <dd className='font-mono text-text'>{String(qbt.apiVersion)}</dd>
                </div>
              </dl>
            ) : null}
          </div>
        </div>
      )}
      {children}
    </section>
  )
}
