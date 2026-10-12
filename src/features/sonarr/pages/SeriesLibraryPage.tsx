import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { LibraryFilters } from '../components/LibraryFilters';
import { SeriesCard } from '../components/SeriesCard';
import { SonarrError } from '../components/SonarrError';
import { useLibraryParams, type LibraryParams } from '../hooks/useLibraryParams';
import { useSeriesList } from '../hooks/useSeries';
import { matchesSeriesQuery } from '../lib/filterSeries';
import { sortSeries } from '../lib/sortSeries';
import type { SeriesSummary } from '../services/types';

function visibleSeries(series: SeriesSummary[], { query, status, sort }: LibraryParams): SeriesSummary[] {
	const filtered = series.filter((item) => (status === 'all' || item.status === status) && matchesSeriesQuery(item, query));
	return sortSeries(filtered, sort);
}

function SeriesGrid({ series, params }: { series: SeriesSummary[]; params: LibraryParams }) {
	if (series.length === 0) return <p className='py-8 text-center text-sm text-text-muted'>Nenhuma série no Sonarr</p>;
	const visible = visibleSeries(series, params);
	if (visible.length === 0) return <p className='py-8 text-center text-sm text-text-muted'>Nenhuma série com esse nome</p>;
	return (
		<ul className='grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3'>
			{visible.map((item) => (
				<li key={item.id}>
					<SeriesCard series={item} />
				</li>
			))}
		</ul>
	);
}

/**
 * Sonarr library as a poster grid: name filter, status filter and sort, all kept in the URL.
 * @example <Route path='sonarr' element={<SeriesLibraryPage />} />
 */
export function SeriesLibraryPage() {
	const { data, error, isPending } = useSeriesList();
	const { params, setParam } = useLibraryParams();
	return (
		<div className='mx-auto max-w-7xl space-y-4'>
			<PageHeader
				title='Séries'
				subtitle={data ? `${data.length} séries no Sonarr` : undefined}
				actions={<Input aria-label='Filtrar por nome' placeholder='Filtrar por nome' value={params.query} onChange={(event) => setParam('q', event.target.value)} className='w-64' />}
			/>
			{isPending && !error && <LoadingSpinner />}
			{error && !data && <SonarrError error={error} />}
			{data && (
				<>
					<LibraryFilters
						series={data}
						status={params.status}
						sort={params.sort}
						onStatusChange={(status) => setParam('status', status, 'all')}
						onSortChange={(sort) => setParam('sort', sort, 'title')}
					/>
					<SeriesGrid series={data} params={params} />
				</>
			)}
		</div>
	);
}
