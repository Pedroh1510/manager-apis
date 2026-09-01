import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useMangasStatus } from '../../mangas/hooks/useMangasStatus'

export function MangasStatusSection() {
  const { isLoading, isSuccess, isError, data } = useMangasStatus()
  const status = isLoading ? 'loading' : isSuccess ? 'online' : 'offline'

  return (
    <section>
      <h2 className='mb-4 text-lg font-semibold text-text'>Mangas Manager</h2>
      <div className='flex items-center gap-3'>
        <span className='text-sm text-text-muted'>API:</span>
        <StatusBadge status={status} />
      </div>
      {isError && (
        <p className='mt-4 text-sm text-danger'>
          Não foi possível conectar à API de Mangas.
        </p>
      )}
      {isSuccess && data && (
        <div className='mt-6'>
          <h3 className='mb-3 text-sm font-semibold text-text'>Database</h3>
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
    </section>
  )
}
