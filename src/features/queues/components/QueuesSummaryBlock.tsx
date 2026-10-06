import { Button } from '../../../components/ui/Button';
import { useQueuesSummary } from '../hooks/useQueuesSummary';
import type { QueuesApi } from '../services/types';
import { QueueCards } from './QueueCards';

/**
 * Queue cards of one API with their own loading/error state, so one API being
 * down never hides the other's queues.
 * @example <QueuesSummaryBlock api='anime-rss' />
 */
export function QueuesSummaryBlock({ api }: { api: QueuesApi }) {
	const { data, isLoading, isError, isFetching, refetch } = useQueuesSummary(api);

	return (
		<div>
			<div className='mb-2 flex items-center justify-between'>
				<h3 className='text-[11px] font-medium uppercase tracking-wider text-text-subtle'>Filas</h3>
				<Button size='sm' variant='ghost' onClick={() => refetch()} disabled={isFetching}>
					Atualizar
				</Button>
			</div>
			{isLoading && <p className='text-xs text-text-muted'>Carregando filas…</p>}
			{isError && <p className='rounded-md bg-danger-bg px-3 py-2 text-xs text-danger'>Filas indisponíveis</p>}
			{data && <QueueCards queues={data} />}
		</div>
	);
}
