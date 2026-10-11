import { Link } from 'react-router-dom';
import { Table, Td, Th } from '../../../components/ui/Table';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { formatDate } from '../../../lib/formatDate';
import { formatEpisodeCode, missingSubject } from '../lib/formatSeries';
import type { MissingEpisode } from '../services/types';
import { SearchActions } from './ActionIcons';

const CHECKBOX = `h-4 w-4 rounded border-border accent-accent ${FOCUS_RING}`;

interface MissingTableProps {
	records: MissingEpisode[];
	selected: ReadonlySet<number>;
	onSelectionChange: (selected: ReadonlySet<number>) => void;
	busyEpisodeId: number | undefined;
	onSearch: (episode: MissingEpisode) => void;
	onInteractive: (episode: MissingEpisode) => void;
}

/**
 * One page of missing episodes with a checkbox and both searches per row.
 * @example <MissingTable records={page.records} selected={ids} onSelectionChange={setIds} ... />
 */
export function MissingTable({ records, selected, onSelectionChange, busyEpisodeId, onSearch, onInteractive }: MissingTableProps) {
	const isAllSelected = records.length > 0 && records.every((episode) => selected.has(episode.episodeId));
	const toggle = (episodeId: number) => {
		const next = new Set(selected);
		if (!next.delete(episodeId)) next.add(episodeId);
		onSelectionChange(next);
	};
	return (
		<Table>
			<thead>
				<tr>
					<Th className='w-8'>
						<input
							type='checkbox'
							aria-label='Selecionar todos da página'
							checked={isAllSelected}
							onChange={() => onSelectionChange(new Set(isAllSelected ? [] : records.map((episode) => episode.episodeId)))}
							className={CHECKBOX}
						/>
					</Th>
					<Th>Série</Th>
					<Th>Episódio</Th>
					<Th>Título</Th>
					<Th>Exibição</Th>
					<Th className='w-20'>Ações</Th>
				</tr>
			</thead>
			<tbody>
				{records.map((episode) => {
					const subject = missingSubject(episode);
					return (
						<tr key={episode.episodeId}>
							<Td>
								<input type='checkbox' aria-label={`Selecionar ${subject}`} checked={selected.has(episode.episodeId)} onChange={() => toggle(episode.episodeId)} className={CHECKBOX} />
							</Td>
							<Td>
								<Link to={`/sonarr/${episode.seriesId}`} className={`rounded-sm text-text hover:text-accent hover:underline ${FOCUS_RING}`}>
									{episode.seriesTitle}
								</Link>
							</Td>
							<Td className='font-mono'>{formatEpisodeCode(episode.seasonNumber, episode.episodeNumber)}</Td>
							<Td>{episode.title}</Td>
							<Td className='font-mono'>{episode.airDateUtc ? formatDate(episode.airDateUtc) : '—'}</Td>
							<Td>
								<SearchActions
									subject={subject}
									isSearching={busyEpisodeId === episode.episodeId}
									onSearch={() => onSearch(episode)}
									onInteractive={() => onInteractive(episode)}
								/>
							</Td>
						</tr>
					);
				})}
			</tbody>
		</Table>
	);
}
