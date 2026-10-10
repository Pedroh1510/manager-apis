import { FOCUS_RING } from '../../../components/ui/focusRing';
import { Toggle } from '../../../components/ui/Toggle';
import { targetKey, type ActionTarget } from '../hooks/useSeriesActions';
import type { SeasonDetail } from '../services/types';
import { SearchActions } from './ActionIcons';
import { EpisodesTable, type SeriesRowActions } from './EpisodesTable';

interface SeasonSectionProps {
	season: SeasonDetail;
	isOpen: boolean;
	onToggle: () => void;
	actions: SeriesRowActions;
}

const SPECIALS_SEASON = 0;

/**
 * Collapsible season: header with count, monitor switch and search actions; episodes when open.
 * @example <SeasonSection season={season} isOpen onToggle={toggle} actions={actions} />
 */
export function SeasonSection({ season, isOpen, onToggle, actions }: SeasonSectionProps) {
	const title = season.seasonNumber === SPECIALS_SEASON ? 'Especiais' : `Temporada ${season.seasonNumber}`;
	const target: ActionTarget = { kind: 'season', seasonNumber: season.seasonNumber };
	return (
		<section className='space-y-2'>
			<div className='flex items-center gap-3'>
				<h2 className='flex-1'>
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
				<Toggle
					label={`Monitorar ${title}`}
					checked={season.monitored}
					disabled={actions.busyMonitorKey === targetKey(target)}
					onChange={(monitored) => actions.toggleMonitored(target, monitored)}
				/>
				<SearchActions
					subject={title}
					isSearching={actions.busySearchKey === targetKey(target)}
					onSearch={() => actions.search(target)}
					onInteractive={() => actions.openReleases(target, title)}
				/>
			</div>
			{isOpen && <EpisodesTable season={season} actions={actions} />}
		</section>
	);
}
