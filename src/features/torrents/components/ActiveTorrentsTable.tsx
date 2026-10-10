import { Table, Td, Th } from '../../../components/ui/Table';
import { formatEta, formatProgress, formatSpeed } from '../lib/formatTorrent';
import type { ActiveTorrent } from '../services/types';

/**
 * Downloading torrents in the order the server sorted them (shortest ETA first).
 * @example <ActiveTorrentsTable torrents={data.active} />
 */
export function ActiveTorrentsTable({ torrents }: { torrents: ActiveTorrent[] }) {
	if (torrents.length === 0) {
		return <p className='py-8 text-center text-sm text-text-muted'>Nenhum torrent baixando</p>;
	}
	return (
		<Table>
			<thead>
				<tr>
					<Th>Nome</Th>
					<Th>Progresso</Th>
					<Th>Velocidade</Th>
					<Th>ETA</Th>
					<Th>Categoria</Th>
				</tr>
			</thead>
			<tbody>
				{torrents.map((torrent) => (
					<tr key={torrent.hash}>
						<Td className='max-w-md truncate'>{torrent.name}</Td>
						<Td className='font-mono'>{formatProgress(torrent.progress)}</Td>
						<Td className='font-mono'>{formatSpeed(torrent.downloadSpeed)}</Td>
						<Td className='font-mono'>{formatEta(torrent.etaSeconds)}</Td>
						<Td>{torrent.category || '—'}</Td>
					</tr>
				))}
			</tbody>
		</Table>
	);
}
