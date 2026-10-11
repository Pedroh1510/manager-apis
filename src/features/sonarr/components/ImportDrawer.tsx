import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Table, Th } from '../../../components/ui/Table';
import { getApiErrorMessage } from '../../../lib/apiError';
import { useManualImport } from '../hooks/useManualImport';
import { useSeriesList } from '../hooks/useSeries';
import { canImport, checkedFiles, initialSelection, toImportChoices, type ImportSelection } from '../lib/importSelection';
import { fetchImportFiles } from '../services/api';
import type { ImportCandidate, StuckDownload } from '../services/types';
import { ImportFileRow } from './ImportFileRow';

interface ImportFilesProps {
	download: StuckDownload;
	files: ImportCandidate[];
	onImported: () => void;
}

function ImportFiles({ download, files, onImported }: ImportFilesProps) {
	const [selection, setSelection] = useState<ImportSelection>(() => initialSelection(files));
	const series = useSeriesList().data ?? [];
	const { start, isImporting } = useManualImport(onImported);
	return (
		<div className='space-y-4'>
			<Table>
				<thead>
					<tr>
						<Th className='w-8' />
						<Th>Arquivo</Th>
						<Th>Série e episódios</Th>
					</tr>
				</thead>
				<tbody>
					{files.map((file) => (
						<ImportFileRow key={file.path} file={file} selection={selection[file.path]} series={series} onChange={(next) => setSelection((current) => ({ ...current, [file.path]: next }))} />
					))}
				</tbody>
			</Table>
			<Button variant='primary' className='w-full' disabled={isImporting || !canImport(selection)} onClick={() => start(download.downloadId, toImportChoices(selection))}>
				{isImporting ? 'Importando…' : `Importar (${checkedFiles(selection).length})`}
			</Button>
		</div>
	);
}

function ImportPanel({ download, onImported }: { download: StuckDownload; onImported: () => void }) {
	const files = useQuery({ queryKey: ['sonarr', 'import-files', download.downloadId], queryFn: () => fetchImportFiles(download.downloadId), gcTime: 0 });
	if (files.isPending) return <LoadingSpinner />;
	if (files.isError) return <ErrorMessage message={getApiErrorMessage(files.error)} />;
	return <ImportFiles download={download} files={files.data} onImported={onImported} />;
}

interface ImportDrawerProps {
	/** null keeps the drawer closed. */
	download: StuckDownload | null;
	onClose: () => void;
}

/**
 * Manual import of one stuck download; closes and refreshes the queue once Sonarr reports success.
 * @example <ImportDrawer download={selected} onClose={close} />
 */
export function ImportDrawer({ download, onClose }: ImportDrawerProps) {
	const queryClient = useQueryClient();
	const onImported = () => {
		onClose();
		void queryClient.invalidateQueries({ queryKey: ['sonarr', 'import-queue'] });
	};
	return (
		<Drawer open={download !== null} title={`Importar — ${download?.title ?? ''}`} onClose={onClose} size='wide'>
			{download && <ImportPanel key={download.downloadId} download={download} onImported={onImported} />}
		</Drawer>
	);
}
