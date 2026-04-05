import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useTorrents } from '../hooks/useTorrents';
import type { Torrent } from '../services/types';

export function AnimeRssAdminPage() {
	const { torrents, concludedTorrents, stopTorrent, deleteTorrent, deleteAll } =
		useTorrents();
	const [pendingDelete, setPendingDelete] = useState<Torrent | null>(null);
	const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

	return (
		<div>
			<div className='mb-6 flex items-center justify-between'>
				<h1 className='text-2xl font-bold text-gray-900'>
					Anime RSS — ADM Torrents
				</h1>
				<button
					onClick={() => setConfirmDeleteAll(true)}
					className='rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700'
				>
					Deletar Todos os Torrents
				</button>
			</div>

			{torrents.isLoading && <LoadingSpinner />}

			{torrents.data && torrents.data.length === 0 && (
				<p className='text-sm text-gray-500'>Nenhum torrent ativo.</p>
			)}

			{torrents.data && torrents.data.length > 0 && (
				<div className='overflow-hidden rounded-lg border bg-white shadow-sm'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
									Nome
								</th>
								<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
									Estado
								</th>
								<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
									Progresso
								</th>
								<th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
									Ações
								</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-gray-200 bg-white'>
							{torrents.data.map((torrent) => (
								<tr key={torrent.hash}>
									<td className='px-4 py-3 text-sm text-gray-900'>
										{torrent.name}
									</td>
									<td className='px-4 py-3 text-sm text-gray-500'>
										{torrent.state}
									</td>
									<td className='px-4 py-3 text-sm text-gray-500'>
										{(torrent.progress * 100).toFixed(1)}%
									</td>
									<td className='px-4 py-3 text-right'>
										<button
											aria-label={`Pausar ${torrent.name}`}
											onClick={() => stopTorrent.mutate(torrent.hash)}
											className='mr-2 rounded border border-yellow-400 px-2 py-1 text-xs text-yellow-700 hover:bg-yellow-50'
										>
											Pausar
										</button>
										<button
											aria-label={`Deletar ${torrent.name}`}
											onClick={() => setPendingDelete(torrent)}
											className='rounded border border-red-400 px-2 py-1 text-xs text-red-700 hover:bg-red-50'
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
