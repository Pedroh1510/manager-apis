import type { ReactNode } from 'react'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useMangasStatus } from '../../mangas/hooks/useMangasStatus'

/** API health card; `children` adds blocks such as queues or migrations below the details. */
export function MangasStatusSection({ children }: { children?: ReactNode }) {
  const { isLoading, isSuccess, isError, data } = useMangasStatus()
  const status = isLoading ? 'loading' : isSuccess ? 'online' : 'offline'

  return (
    <section className='space-y-5 rounded-lg border border-border bg-surface p-4 shadow-raised'>
      <h2 className='text-sm font-semibold text-text'>Mangas Manager</h2>
      <div className='flex items-center gap-3'>
        <span className='text-sm text-text-muted'>API:</span>
        <StatusBadge status={status} />
      </div>
      {isError && (
        <p className='text-sm text-danger'>
          Não foi possível conectar à API de Mangas.
        </p>
      )}
      {isSuccess && data && (
        <div className=''>
          <h3 className='mb-2 text-[11px] font-medium uppercase tracking-wider text-text-subtle'>Database</h3>
          <dl className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3'>
            <div>
              <dt className='text-text-subtle'>Versão</dt>
              <dd className='font-mono text-text'>{data.version}</dd>
            </div>
            <div>
              <dt className='text-text-subtle'>Conexões máximas</dt>
              <dd className='font-mono text-text'>{data.maxConnections}</dd>
            </div>
            <div>
              <dt className='text-text-subtle'>Conexões abertas</dt>
              <dd className='font-mono text-text'>{data.openedConnections}</dd>
            </div>
          </dl>
        </div>
      )}
      {children}
    </section>
  )
}
