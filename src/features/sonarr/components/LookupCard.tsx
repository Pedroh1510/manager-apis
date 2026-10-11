import { Link } from 'react-router-dom';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import type { SeriesLookupResult } from '../services/types';
import { PosterImage } from './PosterImage';

function LookupSummary({ series }: { series: SeriesLookupResult }) {
	const meta = [series.year, series.network].filter(Boolean).join(' · ');
	return (
		<>
			<PosterImage src={series.remotePoster} title={series.title} className='w-20 shrink-0' />
			<div className='min-w-0 flex-1 space-y-1 text-left'>
				<p className='truncate text-sm font-medium text-text'>{series.title}</p>
				<p className='text-xs text-text-muted'>{meta}</p>
				{series.overview && <p className='line-clamp-3 text-xs text-text-subtle'>{series.overview}</p>}
			</div>
		</>
	);
}

interface LookupCardProps {
	series: SeriesLookupResult;
	/** Library id, from the lookup or from an add made on this screen. */
	librarySeriesId: number | null;
	onSelect: () => void;
}

const CARD = 'flex w-full gap-3 rounded-lg border border-border bg-surface p-2.5';

/**
 * One lookup result: a button that opens the add form, or a "Na biblioteca" link when Sonarr already has it.
 * @example <LookupCard series={severance} librarySeriesId={null} onSelect={open} />
 */
export function LookupCard({ series, librarySeriesId, onSelect }: LookupCardProps) {
	if (librarySeriesId !== null) {
		return (
			<article className={`${CARD} opacity-80`}>
				<LookupSummary series={series} />
				<Link to={`/sonarr/${librarySeriesId}`} className={`self-start rounded-sm text-xs font-medium text-accent hover:underline ${FOCUS_RING}`}>
					Na biblioteca
				</Link>
			</article>
		);
	}
	return (
		<button
			type='button'
			aria-label={`Adicionar ${series.title}`}
			onClick={onSelect}
			className={`${CARD} transition-colors hover:border-text-subtle hover:bg-surface-raised ${FOCUS_RING}`}
		>
			<LookupSummary series={series} />
		</button>
	);
}
