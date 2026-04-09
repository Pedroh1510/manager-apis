import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useAnimeStatus } from '../../anime-rss/hooks/useAnimeStatus'

export function AnimeRssStatusSection() {
  const { isLoading, isSuccess, isError, data } = useAnimeStatus()
  const status = isLoading ? 'loading' : isSuccess ? 'online' : 'offline'
  const db = data?.database as Record<string, unknown> | undefined
  const qbt = data?.qbittorrent as Record<string, unknown> | undefined

  return (
    <section>
      <h2 className='mb-4 text-xl font-semibold text-gray-800'>Anime RSS</h2>
      <div className='flex items-center gap-3'>
        <span className='text-sm text-gray-600'>API:</span>
        <StatusBadge status={status} />
      </div>
      {isError && (
        <p className='mt-4 text-sm text-red-600'>
          Não foi possível conectar à API de RSS.
        </p>
      )}
      {isSuccess && data && (
        <div className='mt-6 space-y-6'>
          <div>
            <h3 className='mb-3 text-lg font-semibold text-gray-800'>Database</h3>
            {db && 'error' in db ? (
              <p className='text-sm text-red-600'>{String(db.error)}</p>
            ) : db ? (
              <dl className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3'>
                <div>
                  <dt className='text-gray-500'>Versão</dt>
                  <dd className='font-mono text-gray-900'>{String(db.version)}</dd>
                </div>
                <div>
                  <dt className='text-gray-500'>Conexões máximas</dt>
                  <dd className='font-mono text-gray-900'>{String(db.maxConnections)}</dd>
                </div>
                <div>
                  <dt className='text-gray-500'>Conexões ativas</dt>
                  <dd className='font-mono text-gray-900'>{String(db.activeConnections)}</dd>
                </div>
              </dl>
            ) : null}
          </div>
          <div>
            <h3 className='mb-3 text-lg font-semibold text-gray-800'>qBittorrent</h3>
            {qbt && 'error' in qbt ? (
              <p className='text-sm text-red-600'>{String(qbt.error)}</p>
            ) : qbt ? (
              <dl className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3'>
                <div>
                  <dt className='text-gray-500'>Versão</dt>
                  <dd className='font-mono text-gray-900'>{String(qbt.version)}</dd>
                </div>
                <div>
                  <dt className='text-gray-500'>API Version</dt>
                  <dd className='font-mono text-gray-900'>{String(qbt.apiVersion)}</dd>
                </div>
              </dl>
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
