import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Table, Td, Th } from '../../../components/ui/Table';
import { useTorrents } from '../hooks/useTorrents';
import type { Torrent } from '../services/types';

function ProgressBar({ progress }: { progress: number }) {
	const percent = Math.round(progress * 1000) / 10;
	return (
		<div className='flex items-center gap-2'>
			<div className='h-1 w-24 overflow-hidden rounded-full bg-surface-raised'>
				<div className={`h-full rounded-full ${progress >= 1 ? 'bg-success' : 'bg-accent'}`} style={{ width: `${percent}%` }} />
			</div>
			<span className='font-mono text-xs tabular-nums text-text-muted'>{percent.toFixed(1)}%</span>
		</div>
	);
}

function TorrentsTable({ torrents, onStop, onDelete }: { torrents: Torrent[]; onStop: (t: Torrent) => void; onDelete: (t: Torrent) => void }) {
	return (
		<Table>
			<thead>
				<tr>
					<Th>Nome</Th>
					<Th className='w-36'>Estado</Th>
					<Th className='w-44'>Progresso</Th>
					<Th className='w-40 text-right'>Ações</Th>
				</tr>
			</thead>
			<tbody>
				{torrents.map((torrent) => (
					<tr key={torrent.hash} className='group transition-colors hover:bg-surface-raised/60'>
						<Td className='max-w-0 truncate' title={torrent.name}>
							{torrent.name}
						</Td>
						<Td className='font-mono text-xs text-text-muted'>{torrent.state}</Td>
						<Td>
							<ProgressBar progress={torrent.progress} />
						</Td>
						<Td className='space-x-1 text-right'>
							<Button size='sm' variant='ghost' aria-label={`Pausar ${torrent.name}`} onClick={() => onStop(torrent)}>
								Pausar
							</Button>
							<Button
								size='sm'
								variant='ghost'
								aria-label={`Deletar ${torrent.name}`}
								className='text-danger opacity-70 hover:text-danger group-hover:opacity-100'
								onClick={() => onDelete(torrent)}
							>
								Deletar
							</Button>
						</Td>
					</tr>
				))}
			</tbody>
		</Table>
	);
}

export function AnimeRssAdminPage() {
	const { torrents, stopTorrent, deleteTorrent, deleteAll } = useTorrents();
	const [pendingDelete, setPendingDelete] = useState<Torrent | null>(null);
	const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
	const list = torrents.data ?? [];

	return (
		<div className='mx-auto max-w-6xl'>
			<PageHeader
				title='Torrents'
				subtitle={torrents.isSuccess ? `${list.length} torrents no qBittorrent` : 'Anime RSS — qBittorrent'}
				actions={
					<Button variant='danger' onClick={() => setConfirmDeleteAll(true)}>
						Deletar todos os torrents
					</Button>
				}
			/>

			{torrents.isLoading && <p className='text-xs text-text-muted'>Carregando torrents…</p>}
			{torrents.isSuccess && list.length === 0 && (
				<p className='rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-text-muted'>
					Nenhum torrent ativo.
				</p>
			)}
			{list.length > 0 && (
				<TorrentsTable torrents={list} onStop={(torrent) => stopTorrent.mutate(torrent.hash)} onDelete={setPendingDelete} />
			)}

			<ConfirmDialog
				open={pendingDelete !== null}
				title='Deletar torrent'
				message={`Tem certeza que deseja deletar "${pendingDelete?.name}"?`}
				onConfirm={() => {
					if (pendingDelete) deleteTorrent.mutate(pendingDelete.hash);
					setPendingDelete(null);
				}}
				onCancel={() => setPendingDelete(null)}
			/>
			<ConfirmDialog
				open={confirmDeleteAll}
				title='Deletar todos os torrents'
				message='Tem certeza que deseja deletar TODOS os torrents? Esta ação é irreversível.'
				onConfirm={() => {
					deleteAll.mutate();
					setConfirmDeleteAll(false);
				}}
				onCancel={() => setConfirmDeleteAll(false)}
			/>
		</div>
	);
}
