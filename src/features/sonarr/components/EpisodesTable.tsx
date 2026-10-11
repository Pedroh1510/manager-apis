import { Table, Td, Th } from '../../../components/ui/Table';
import { Toggle } from '../../../components/ui/Toggle';
import { formatDate } from '../../../lib/formatDate';
import { targetKey, type ActionTarget } from '../hooks/useSeriesActions';
import { episodeStateLabel, formatEpisodeCode } from '../lib/formatSeries';
import type { EpisodeState, SeasonDetail } from '../services/types';
import { SearchActions } from './ActionIcons';

const STATE_TONE: Record<EpisodeState, string> = {
	downloaded: 'text-success',
	missing: 'text-danger',
	unaired: 'text-text-muted',
	tba: 'text-text-subtle'
};

/** What a season or episode row can do; implemented by the detail page. */
export interface SeriesRowActions {
	toggleMonitored: (target: ActionTarget, monitored: boolean) => void;
	search: (target: ActionTarget) => void;
	openReleases: (target: ActionTarget, subject: string) => void;
	busyMonitorKey: string | null;
	busySearchKey: string | null;
}

/**
 * Episodes of one season with their state, a monitor switch and the two search actions.
 * @example <EpisodesTable season={season} actions={actions} />
 */
export function EpisodesTable({ season, actions }: { season: SeasonDetail; actions: SeriesRowActions }) {
	return (
		<Table>
			<thead>
				<tr>
					<Th>Episódio</Th>
					<Th>Título</Th>
					<Th>Exibição</Th>
					<Th>Situação</Th>
					<Th>Monitorado</Th>
					<Th className='w-20'>Ações</Th>
				</tr>
			</thead>
			<tbody>
				{season.episodes.map((episode) => {
					const code = formatEpisodeCode(season.seasonNumber, episode.episodeNumber);
					const target: ActionTarget = { kind: 'episode', episodeId: episode.id };
					return (
						<tr key={episode.id}>
							<Td className='font-mono'>{code}</Td>
							<Td>{episode.title}</Td>
							<Td className='font-mono'>{episode.airDateUtc ? formatDate(episode.airDateUtc) : '—'}</Td>
							<Td className={STATE_TONE[episode.state]}>{episodeStateLabel(episode.state)}</Td>
							<Td>
								<Toggle
									label={`Monitorar ${code}`}
									checked={episode.monitored}
									disabled={actions.busyMonitorKey === targetKey(target)}
									onChange={(monitored) => actions.toggleMonitored(target, monitored)}
								/>
							</Td>
							<Td>
								<SearchActions
									subject={code}
									isSearching={actions.busySearchKey === targetKey(target)}
									onSearch={() => actions.search(target)}
									onInteractive={() => actions.openReleases(target, code)}
								/>
							</Td>
						</tr>
					);
				})}
			</tbody>
		</Table>
	);
}
