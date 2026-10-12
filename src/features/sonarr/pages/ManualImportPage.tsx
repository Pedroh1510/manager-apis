import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { getApiErrorMessage } from '../../../lib/apiError';
import { useServerConfig } from '../../server-config/hooks/useServerConfig';
import { ImportDrawer, type ImportTarget } from '../components/ImportDrawer';
import { UploadFolderSection } from '../components/UploadFolderSection';
import { UPLOADS_QUERY_KEY } from '../lib/queryKeys';
import { UploadSection } from '../components/UploadSection';
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

function StuckDownloadsSection({ onOpen }: { onOpen: (download: StuckDownload) => void }) {
	const queue = useQuery({ queryKey: ['sonarr', 'import-queue'], queryFn: fetchStuckDownloads });
	return (
		<section aria-labelledby='stuck-heading' className='space-y-3'>
			<h2 id='stuck-heading' className='text-sm font-semibold text-text'>Downloads travados</h2>
			{queue.isPending && <LoadingSpinner />}
			{queue.isError && <ErrorMessage message={getApiErrorMessage(queue.error)} />}
			{queue.data?.length === 0 && <p className='py-4 text-center text-sm text-text-muted'>Nenhum download aguardando importação</p>}
			{queue.data && queue.data.length > 0 && (
				<ul className='space-y-2'>
					{queue.data.map((download) => <StuckDownloadItem key={download.downloadId} download={download} onOpen={() => onOpen(download)} />)}
				</ul>
			)}
		</section>
	);
}

/** `?serie=<id>` comes from the detail-page shortcut; anything else means no preselected series. */
function useSeriesParam(): number | null {
	const raw = Number(useSearchParams()[0].get('serie'));
	return Number.isInteger(raw) && raw > 0 ? raw : null;
}

/**
 * Upload, the upload folder and the downloads Sonarr holds; all import through the same drawer (PR 4a/4b).
 * @example <Route path='sonarr/importar' element={<ManualImportPage />} />
 */
export function ManualImportPage() {
	const isUploadOn = useServerConfig().data?.sonarrUpload === true;
	const seriesId = useSeriesParam();
	const queryClient = useQueryClient();
	const [target, setTarget] = useState<ImportTarget | null>(null);
	const openFolder = () => {
		const source = seriesId === null ? { source: 'upload' as const } : { source: 'upload' as const, seriesId };
		setTarget({ title: 'Pasta de upload', source, defaultSeriesId: seriesId });
	};
	return (
		<div className='mx-auto max-w-5xl space-y-8'>
			<PageHeader title='Importar' subtitle='Envie episódios ou resolva o que o Sonarr não conseguiu importar sozinho' />
			{isUploadOn && <UploadSection onUploaded={() => void queryClient.invalidateQueries({ queryKey: UPLOADS_QUERY_KEY })} />}
			{isUploadOn && <UploadFolderSection onImport={openFolder} />}
			<StuckDownloadsSection onOpen={(download) => setTarget({ title: download.title, source: { downloadId: download.downloadId }, defaultSeriesId: null })} />
			<ImportDrawer target={target} onClose={() => setTarget(null)} />
		</div>
	);
}
