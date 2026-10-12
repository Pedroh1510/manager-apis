import { Link } from 'react-router-dom';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import type { SeriesSummary } from '../services/types';
import { SeriesPoster } from './SeriesPoster';
import { SeriesStatusBadge } from './SeriesStatusBadge';

/**
 * Library tile: poster, title, year, status and downloaded/aired episodes.
 * @example <SeriesCard series={wire} />
 */
export function SeriesCard({ series }: { series: SeriesSummary }) {
	return (
		<Link
			to={`/sonarr/${series.id}`}
			className={`group flex flex-col gap-2 rounded-lg p-1.5 transition-colors hover:bg-surface-raised ${FOCUS_RING}`}
		>
			<SeriesPoster seriesId={series.id} title={series.title} className='w-full transition-transform group-hover:-translate-y-0.5' />
			<div className='space-y-1 px-0.5'>
				<p className='truncate text-sm font-medium text-text'>{series.title}</p>
				<p className='flex items-center justify-between gap-2 text-xs text-text-muted'>
					<span>{series.year}</span>
					<SeriesStatusBadge status={series.status} />
				</p>
				<p className='font-mono text-xs text-text-subtle'>{`${series.episodeFileCount}/${series.episodeCount} episódios`}</p>
			</div>
		</Link>
	);
}
