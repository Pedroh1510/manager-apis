import { useSearchParams } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SeriesCard } from '../components/SeriesCard';
import { SonarrError } from '../components/SonarrError';
import { useSeriesList } from '../hooks/useSeries';
import { matchesSeriesQuery } from '../lib/filterSeries';
import type { SeriesSummary } from '../services/types';

/** `?q=` keeps the filter across reloads and shared links, like the mangas list. */
function useSeriesQuery(): [string, (value: string) => void] {
	const [params, setParams] = useSearchParams();
	const setQuery = (value: string) =>
		setParams((current) => {
			const next = new URLSearchParams(current);
			if (value) next.set('q', value);
			else next.delete('q');
			return next;
		}, { replace: true });
	return [params.get('q') ?? '', setQuery];
}

function SeriesGrid({ series, query }: { series: SeriesSummary[]; query: string }) {
	if (series.length === 0) return <p className='py-8 text-center text-sm text-text-muted'>Nenhuma série no Sonarr</p>;
	const visible = series.filter((item) => matchesSeriesQuery(item, query));
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
 * Sonarr library as a poster grid, filtered by name (title or alternate titles).
 * @example <Route path='sonarr' element={<SeriesLibraryPage />} />
 */
export function SeriesLibraryPage() {
	const { data, error, isPending } = useSeriesList();
	const [query, setQuery] = useSeriesQuery();
	return (
		<div className='mx-auto max-w-7xl space-y-4'>
			<PageHeader
				title='Séries'
				subtitle={data ? `${data.length} séries no Sonarr` : undefined}
				actions={<Input aria-label='Filtrar por nome' placeholder='Filtrar por nome' value={query} onChange={(event) => setQuery(event.target.value)} className='w-64' />}
			/>
			{isPending && !error && <LoadingSpinner />}
			{error && !data && <SonarrError error={error} />}
			{data && <SeriesGrid series={data} query={query} />}
		</div>
	);
}
