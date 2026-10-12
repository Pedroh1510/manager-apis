import { Table, Td, Th } from '../../../components/ui/Table';
import { formatDate } from '../../../lib/formatDate';
import { episodeStateLabel, formatEpisodeCode } from '../lib/formatSeries';
import type { EpisodeState, SeasonDetail } from '../services/types';

const STATE_TONE: Record<EpisodeState, string> = {
	downloaded: 'text-success',
	missing: 'text-danger',
	unaired: 'text-text-muted',
	tba: 'text-text-subtle'
};

/**
 * Read-only in this PR; the monitor toggle and search buttons land in PR 3.
 * @example <EpisodesTable season={season} />
 */
export function EpisodesTable({ season }: { season: SeasonDetail }) {
	return (
		<Table>
			<thead>
				<tr>
					<Th>Episódio</Th>
					<Th>Título</Th>
					<Th>Exibição</Th>
					<Th>Situação</Th>
					<Th>Monitorado</Th>
				</tr>
			</thead>
			<tbody>
				{season.episodes.map((episode) => (
					<tr key={episode.id}>
						<Td className='font-mono'>{formatEpisodeCode(season.seasonNumber, episode.episodeNumber)}</Td>
						<Td>{episode.title}</Td>
						<Td className='font-mono'>{episode.airDateUtc ? formatDate(episode.airDateUtc) : '—'}</Td>
						<Td className={STATE_TONE[episode.state]}>{episodeStateLabel(episode.state)}</Td>
						<Td className='text-text-muted'>{episode.monitored ? 'Sim' : 'Não'}</Td>
					</tr>
				))}
			</tbody>
		</Table>
	);
}
