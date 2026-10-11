import { useSeriesDetail } from '../hooks/useSeries';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { getApiErrorMessage } from '../../../lib/apiError';
import { formatEpisodeCode, seasonLabel } from '../lib/formatSeries';
import type { EpisodeRef } from '../services/types';

interface EpisodePickerProps {
	/** Names the group, e.g. the file the episodes are for. */
	label: string;
	seriesId: number;
	selected: EpisodeRef[];
	onChange: (episodes: EpisodeRef[]) => void;
}

/**
 * Every episode of the series by season, newest season first, as checkboxes.
 * @example <EpisodePicker label='Episódios de a.mkv' seriesId={2} selected={[]} onChange={set} />
 */
export function EpisodePicker({ label, seriesId, selected, onChange }: EpisodePickerProps) {
	const detail = useSeriesDetail(seriesId);
	if (detail.isPending) return <LoadingSpinner />;
	if (detail.isError) return <ErrorMessage message={getApiErrorMessage(detail.error)} />;
	const isSelected = (id: number) => selected.some((episode) => episode.id === id);
	const toggle = (episode: EpisodeRef) =>
		onChange(isSelected(episode.id) ? selected.filter((item) => item.id !== episode.id) : [...selected, episode]);
	return (
		<div role='group' aria-label={label} className='max-h-64 space-y-3 overflow-y-auto'>
			{detail.data.seasons.map((season) => (
				<section key={season.seasonNumber} className='space-y-1'>
					<h4 className='text-xs font-medium text-text-muted'>{seasonLabel(season.seasonNumber)}</h4>
					{season.episodes.map((episode) => {
						const ref = { id: episode.id, seasonNumber: season.seasonNumber, episodeNumber: episode.episodeNumber };
						return (
							<label key={episode.id} className='flex items-center gap-2 text-sm text-text'>
								<input type='checkbox' checked={isSelected(episode.id)} onChange={() => toggle(ref)} className={`h-4 w-4 accent-accent ${FOCUS_RING}`} />
								{`${formatEpisodeCode(season.seasonNumber, episode.episodeNumber)} — ${episode.title}`}
							</label>
						);
					})}
				</section>
			))}
		</div>
	);
}
