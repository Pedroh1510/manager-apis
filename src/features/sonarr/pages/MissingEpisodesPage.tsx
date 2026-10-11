import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Pagination } from '../../../components/ui/Pagination';
import { getApiErrorMessage } from '../../../lib/apiError';
import { MissingTable } from '../components/MissingTable';
import { ReleasesDrawer } from '../components/ReleasesDrawer';
import { useMissingActions } from '../hooks/useMissingActions';
import { missingSubject } from '../lib/formatSeries';
import { fetchMissing } from '../services/api';
import type { MissingPage, ReleaseQuery } from '../services/types';

function usePageParam(): [number, (page: number) => void] {
	const [search, setSearch] = useSearchParams();
	const page = Number(search.get('page'));
	const goTo = (next: number) => setSearch(next > 1 ? { page: String(next) } : {}, { replace: true });
	return [Number.isInteger(page) && page > 0 ? page : 1, goTo];
}

interface MissingContentProps {
	data: MissingPage;
	onPageChange: (page: number) => void;
}

/** Keyed by page, so its selection starts empty on every page (AC 23). */
function MissingContent({ data, onPageChange }: MissingContentProps) {
	const actions = useMissingActions();
	const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
	const [isConfirmingAll, setIsConfirmingAll] = useState(false);
	const [releaseSearch, setReleaseSearch] = useState<{ query: ReleaseQuery; subject: string } | null>(null);
	if (data.totalRecords === 0) return <p className='py-8 text-center text-sm text-text-muted'>Nenhum episódio faltando</p>;
	return (
		<>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<div className='flex gap-2'>
					<Button disabled={selected.size === 0 || actions.isSearchingSelected} onClick={() => actions.searchSelected([...selected], () => setSelected(new Set()))}>
						{`Buscar selecionados (${selected.size})`}
					</Button>
					<Button onClick={() => setIsConfirmingAll(true)}>Buscar todos</Button>
				</div>
				<Pagination page={data.page} totalPages={Math.max(1, Math.ceil(data.totalRecords / data.pageSize))} onChange={onPageChange} />
			</div>
			<MissingTable
				records={data.records}
				selected={selected}
				onSelectionChange={setSelected}
				busyEpisodeId={actions.busyEpisodeId}
				onSearch={(episode) => actions.searchOne(episode.episodeId)}
				onInteractive={(episode) => setReleaseSearch({ query: { episodeId: episode.episodeId }, subject: missingSubject(episode) })}
			/>
			<ConfirmDialog
				open={isConfirmingAll}
				title='Buscar todos'
				message={`Buscar ${data.totalRecords} episódios faltantes?`}
				onCancel={() => setIsConfirmingAll(false)}
				onConfirm={() => {
					setIsConfirmingAll(false);
					actions.searchAll();
				}}
			/>
			<ReleasesDrawer search={releaseSearch} onClose={() => setReleaseSearch(null)} />
		</>
	);
}

/**
 * Sonarr's wanted/missing, 20 per page, newest first; search one, the selected or all (decisions F1, F2).
 * @example <Route path='sonarr/faltantes' element={<MissingEpisodesPage />} />
 */
export function MissingEpisodesPage() {
	const [page, goTo] = usePageParam();
	const missing = useQuery({ queryKey: ['sonarr', 'missing', page], queryFn: () => fetchMissing(page) });
	return (
		<div className='mx-auto max-w-6xl space-y-4'>
			<PageHeader title='Faltantes' subtitle={missing.data ? `${missing.data.totalRecords} episódios monitorados sem arquivo` : undefined} />
			{missing.isPending && <LoadingSpinner />}
			{missing.isError && <ErrorMessage message={getApiErrorMessage(missing.error)} />}
			{missing.data && <MissingContent key={page} data={missing.data} onPageChange={goTo} />}
		</div>
	);
}
