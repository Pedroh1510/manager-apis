import type { ReactNode } from 'react';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { getApiErrorMessage } from '../../../lib/apiError';
import { TdarrErrorFiles } from '../components/TdarrErrorFiles';
import { TdarrNodeCard } from '../components/TdarrNodeCard';
import { TdarrStatsPanel } from '../components/TdarrStatsPanel';
import { TdarrWorkerList } from '../components/TdarrWorkerList';
import { useTdarrOverview, useTdarrStats } from '../hooks/useTdarr';

interface QueryBlockProps<T> {
	query: { data: T | undefined; error: unknown; isPending: boolean };
	children: (data: T) => ReactNode;
}

/** Each block loads and fails on its own, so a slow stats call never hides the workers. */
function QueryBlock<T>({ query, children }: QueryBlockProps<T>) {
	if (query.data) return <>{children(query.data)}</>;
	if (query.error) return <p className='text-sm text-danger'>{getApiErrorMessage(query.error)}</p>;
	return <LoadingSpinner />;
}

/**
 * Tdarr read-only dashboard: nodes and workers every 5s, counters and errors every 60s.
 * @example <Route path='tdarr' element={<TdarrPage />} />
 */
export function TdarrPage() {
	const overview = useTdarrOverview();
	const stats = useTdarrStats();
	return (
		<div className='mx-auto max-w-6xl space-y-6'>
			<PageHeader title='Tdarr' subtitle={overview.data ? `v${overview.data.version} · atualizado a cada 5 s` : 'atualizado a cada 5 s'} />
			<QueryBlock query={overview}>
				{({ nodes }) => (
					<>
						<div className='grid gap-4 md:grid-cols-2'>
							{nodes.map((node) => (
								<TdarrNodeCard key={node.id} node={node} />
							))}
						</div>
						<section aria-label='Workers ativos' className='rounded-lg border border-border bg-surface shadow-raised'>
							<h2 className='border-b border-border px-4 py-3 text-sm font-semibold text-text'>Workers ativos</h2>
							<TdarrWorkerList nodes={nodes} />
						</section>
					</>
				)}
			</QueryBlock>
			<QueryBlock query={stats}>
				{(data) => (
					<>
						<TdarrStatsPanel stats={data} />
						<div className='grid gap-4 lg:grid-cols-2'>
							<TdarrErrorFiles title='Erros de transcode' list={data.errors.transcode} />
							<TdarrErrorFiles title='Erros de health check' list={data.errors.healthCheck} />
						</div>
					</>
				)}
			</QueryBlock>
		</div>
	);
}
