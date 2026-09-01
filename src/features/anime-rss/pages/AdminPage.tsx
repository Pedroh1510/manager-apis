import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Button } from '../../../components/ui/Button';
import { useTorrents } from '../hooks/useTorrents';
import type { Torrent } from '../services/types';

export function AnimeRssAdminPage() {
	const { torrents, stopTorrent, deleteTorrent, deleteAll } =
		useTorrents();
	const [pendingDelete, setPendingDelete] = useState<Torrent | null>(null);
	const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

	return (
		<div>
			<div className='mb-6 flex items-center justify-between'>
				<h1 className='text-3xl font-semibold tracking-tight text-text'>
					Anime RSS — ADM Torrents
				</h1>
				<Button variant='danger' onClick={() => setConfirmDeleteAll(true)}>
					Deletar Todos os Torrents
				</Button>
			</div>

			{torrents.isLoading && <LoadingSpinner />}

			{torrents.data && torrents.data.length === 0 && (
				<p className='text-sm text-text-muted'>Nenhum torrent ativo.</p>
			)}

			{torrents.data && torrents.data.length > 0 && (
				<div className='overflow-hidden rounded-lg border border-border bg-surface'>
					<table className='min-w-full divide-y divide-border'>
						<thead className='bg-surface-raised'>
							<tr>
								<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-subtle'>
									Nome
								</th>
								<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-subtle'>
									Estado
								</th>
								<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-subtle'>
									Progresso
								</th>
								<th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-subtle'>
									Ações
								</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-border bg-surface'>
							{torrents.data.map((torrent) => (
								<tr key={torrent.hash}>
									<td className='px-4 py-3 text-sm text-text'>
										{torrent.name}
									</td>
									<td className='px-4 py-3 text-sm text-text-muted'>
										{torrent.state}
									</td>
									<td className='px-4 py-3 text-sm text-text-muted'>
										{(torrent.progress * 100).toFixed(1)}%
									</td>
									<td className='px-4 py-3 text-right'>
										<button
											aria-label={`Pausar ${torrent.name}`}
											onClick={() => stopTorrent.mutate(torrent.hash)}
											className='mr-2 rounded border border-warning/40 px-2 py-1 text-xs text-warning transition-colors hover:bg-warning-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
										>
											Pausar
										</button>
										<button
											aria-label={`Deletar ${torrent.name}`}
											onClick={() => setPendingDelete(torrent)}
											className='rounded border border-danger/40 px-2 py-1 text-xs text-danger transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
										>
											Deletar
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
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
