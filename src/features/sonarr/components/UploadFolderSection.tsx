import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { formatDateTime } from '../../../lib/formatDate';
import { formatBytes } from '../lib/formatSeries';
import { UPLOADS_QUERY_KEY } from '../lib/queryKeys';
import { deleteUpload, fetchUploads } from '../services/api';
import type { UploadedFile } from '../services/types';

function UploadedRow({ file, onDelete }: { file: UploadedFile; onDelete: () => void }) {
	return (
		<li className='flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0'>
			<span className='min-w-0 break-all text-text'>{file.name}</span>
			<span className='flex shrink-0 items-center gap-3 font-mono text-xs text-text-muted'>
				<span>{formatBytes(file.size)}</span>
				<span>{formatDateTime(file.modifiedAt)}</span>
				<Button size='sm' variant='ghost' aria-label={`Excluir ${file.name}`} onClick={onDelete}>
					Excluir
				</Button>
			</span>
		</li>
	);
}

/**
 * Files waiting in SONARR_UPLOAD_DIR, with delete (confirmed) and "Importar da pasta".
 * @example <UploadFolderSection onImport={openFolderImport} />
 */
export function UploadFolderSection({ onImport }: { onImport: () => void }) {
	const queryClient = useQueryClient();
	const toast = useToast();
	const uploads = useQuery({ queryKey: UPLOADS_QUERY_KEY, queryFn: fetchUploads });
	const [pendingDelete, setPendingDelete] = useState<string | null>(null);
	const remove = useMutation({
		mutationFn: (name: string) => deleteUpload(name),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: UPLOADS_QUERY_KEY }),
		onError: (error: unknown) => toast.error(getApiErrorMessage(error))
	});
	const hasFiles = (uploads.data?.length ?? 0) > 0;
	return (
		<section aria-labelledby='upload-folder-heading' className='space-y-3'>
			<div className='flex items-center justify-between'>
				<h2 id='upload-folder-heading' className='text-sm font-semibold text-text'>Pasta de upload</h2>
				{hasFiles && <Button size='sm' variant='primary' onClick={onImport}>Importar da pasta</Button>}
			</div>
			{uploads.isPending && <LoadingSpinner />}
			{uploads.isError && <ErrorMessage message={getApiErrorMessage(uploads.error)} />}
			{uploads.data?.length === 0 && <p className='py-4 text-center text-sm text-text-muted'>Nenhum arquivo na pasta de upload</p>}
			{hasFiles && (
				<ul className='rounded-lg border border-border bg-surface px-3'>
					{uploads.data?.map((file) => <UploadedRow key={file.name} file={file} onDelete={() => setPendingDelete(file.name)} />)}
				</ul>
			)}
			<ConfirmDialog
				open={pendingDelete !== null}
				title='Excluir arquivo'
				message={`Excluir ${pendingDelete ?? ''} da pasta de upload?`}
				onCancel={() => setPendingDelete(null)}
				onConfirm={() => {
					if (pendingDelete) remove.mutate(pendingDelete);
					setPendingDelete(null);
				}}
			/>
		</section>
	);
}
