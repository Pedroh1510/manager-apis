import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { getApiErrorMessage } from '../../../lib/apiError';
import { ImportDrawer } from '../components/ImportDrawer';
import { fetchStuckDownloads } from '../services/api';
import type { StuckDownload } from '../services/types';

function StuckDownloadItem({ download, onOpen }: { download: StuckDownload; onOpen: () => void }) {
	return (
		<li className='flex items-start justify-between gap-4 rounded-lg border border-border bg-surface p-3'>
			<div className='min-w-0 space-y-1'>
				<p className='break-all text-sm font-medium text-text'>{download.title}</p>
				<p className='text-xs text-text-muted'>{download.seriesTitle ?? 'Série não reconhecida'}</p>
				{download.messages.length > 0 && (
					<ul className='space-y-0.5 text-xs text-warning'>
						{download.messages.map((message) => <li key={message}>{message}</li>)}
					</ul>
				)}
			</div>
			<Button size='sm' onClick={onOpen} aria-label={`Importar ${download.title}`}>
				Importar
			</Button>
		</li>
	);
}

/**
 * Downloads Sonarr holds for a manual import; each opens the import drawer (PR 4a).
 * @example <Route path='sonarr/importar' element={<ManualImportPage />} />
 */
export function ManualImportPage() {
	const queue = useQuery({ queryKey: ['sonarr', 'import-queue'], queryFn: fetchStuckDownloads });
	const [selected, setSelected] = useState<StuckDownload | null>(null);
	return (
		<div className='mx-auto max-w-5xl space-y-4'>
			<PageHeader title='Importar' subtitle='Downloads que o Sonarr não conseguiu importar sozinho' />
			{queue.isPending && <LoadingSpinner />}
			{queue.isError && <ErrorMessage message={getApiErrorMessage(queue.error)} />}
			{queue.data?.length === 0 && <p className='py-8 text-center text-sm text-text-muted'>Nenhum download aguardando importação</p>}
			{queue.data && queue.data.length > 0 && (
				<ul className='space-y-2'>
					{queue.data.map((download) => <StuckDownloadItem key={download.downloadId} download={download} onOpen={() => setSelected(download)} />)}
				</ul>
			)}
			<ImportDrawer download={selected} onClose={() => setSelected(null)} />
		</div>
	);
}
