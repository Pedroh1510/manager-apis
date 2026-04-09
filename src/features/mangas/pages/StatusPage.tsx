import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useMangasStatus } from '../hooks/useMangasStatus';

export function MangasStatusPage() {
	const { isLoading, isSuccess, isError, data } = useMangasStatus();
	const status = isLoading ? 'loading' : isSuccess ? 'online' : 'offline';

	return (
		<div>
			<h1 className='mb-6 text-2xl font-bold text-gray-900'>
				Mangas Manager — Status
			</h1>
			<div className='flex items-center gap-3'>
				<span className='text-sm text-gray-600'>API:</span>
				<StatusBadge status={status} />
			</div>
			{isError && (
				<p className='mt-4 text-sm text-red-600'>
					Não foi possível conectar à API de Mangas.
				</p>
			)}
			{isSuccess && data && (
				<div className='mt-6'>
					<h2 className='mb-3 text-lg font-semibold text-gray-800'>Database</h2>
					<dl className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3'>
						<div>
							<dt className='text-gray-500'>Versão</dt>
							<dd className='font-mono text-gray-900'>{data.version}</dd>
						</div>
						<div>
							<dt className='text-gray-500'>Conexões máximas</dt>
							<dd className='font-mono text-gray-900'>{data.maxConnections}</dd>
						</div>
						<div>
							<dt className='text-gray-500'>Conexões abertas</dt>
							<dd className='font-mono text-gray-900'>{data.openedConnections}</dd>
						</div>
					</dl>
				</div>
			)}
		</div>
	);
}
