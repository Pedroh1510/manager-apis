import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useMangasStatus } from '../hooks/useMangasStatus';

export function MangasStatusPage() {
	const { isLoading, isSuccess, isError } = useMangasStatus();
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
		</div>
	);
}
