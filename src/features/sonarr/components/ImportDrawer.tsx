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
import type { ImportCandidate, ImportFileSource } from '../services/types';
import { ImportFileRow } from './ImportFileRow';
import { UPLOADS_QUERY_KEY } from '../lib/queryKeys';

/** What the drawer imports: a stuck download, or the upload folder. */
export interface ImportTarget {
	title: string;
	source: ImportFileSource;
	/** Preselected for files Sonarr could not tie to a series (the detail-page shortcut). */
	defaultSeriesId: number | null;
}

interface ImportFilesProps {
	target: ImportTarget;
	files: ImportCandidate[];
	onImported: () => void;
}

function ImportFiles({ target, files, onImported }: ImportFilesProps) {
	const [selection, setSelection] = useState<ImportSelection>(() => initialSelection(files, target.defaultSeriesId));
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
			<Button variant='primary' className='w-full' disabled={isImporting || !canImport(selection)} onClick={() => start(target.source, toImportChoices(selection))}>
				{isImporting ? 'Importando…' : `Importar (${checkedFiles(selection).length})`}
			</Button>
		</div>
	);
}

function ImportPanel({ target, onImported }: { target: ImportTarget; onImported: () => void }) {
	const files = useQuery({ queryKey: ['sonarr', 'import-files', target.source], queryFn: () => fetchImportFiles(target.source), gcTime: 0 });
	if (files.isPending) return <LoadingSpinner />;
	if (files.isError) return <ErrorMessage message={getApiErrorMessage(files.error)} />;
	return <ImportFiles target={target} files={files.data} onImported={onImported} />;
}

interface ImportDrawerProps {
	/** null keeps the drawer closed. */
	target: ImportTarget | null;
	onClose: () => void;
}

/**
 * Manual import of a stuck download or of the upload folder; closes and refreshes both lists once Sonarr reports success.
 * @example <ImportDrawer target={{ title: 'Pasta de upload', source: { source: 'upload' }, defaultSeriesId: null }} onClose={close} />
 */
export function ImportDrawer({ target, onClose }: ImportDrawerProps) {
	const queryClient = useQueryClient();
	const onImported = () => {
		onClose();
		void queryClient.invalidateQueries({ queryKey: ['sonarr', 'import-queue'] });
		void queryClient.invalidateQueries({ queryKey: UPLOADS_QUERY_KEY });
	};
	return (
		<Drawer open={target !== null} title={`Importar — ${target?.title ?? ''}`} onClose={onClose} size='wide'>
			{target && <ImportPanel key={JSON.stringify(target.source)} target={target} onImported={onImported} />}
		</Drawer>
	);
}
