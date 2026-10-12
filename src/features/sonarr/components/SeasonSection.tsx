import { FOCUS_RING } from '../../../components/ui/focusRing';
import type { SeasonDetail } from '../services/types';
import { EpisodesTable } from './EpisodesTable';

interface SeasonSectionProps {
	season: SeasonDetail;
	isOpen: boolean;
	onToggle: () => void;
}

const SPECIALS_SEASON = 0;

/**
 * Collapsible season: header with downloaded/aired count, episodes table when open.
 * @example <SeasonSection season={season} isOpen onToggle={toggle} />
 */
export function SeasonSection({ season, isOpen, onToggle }: SeasonSectionProps) {
	const title = season.seasonNumber === SPECIALS_SEASON ? 'Especiais' : `Temporada ${season.seasonNumber}`;
	return (
		<section className='space-y-2'>
			<h2>
				<button
					type='button'
					aria-expanded={isOpen}
					onClick={onToggle}
					className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-semibold text-text hover:bg-surface-raised ${FOCUS_RING}`}
				>
					<span>{title}</span>
					<span className='font-mono text-xs font-normal text-text-muted'>{`${season.episodeFileCount}/${season.episodeCount}`}</span>
				</button>
			</h2>
			{isOpen && <EpisodesTable season={season} />}
		</section>
	);
}
