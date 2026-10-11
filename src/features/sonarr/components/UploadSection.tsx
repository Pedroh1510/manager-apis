import { useState, type DragEvent } from 'react';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { useUploadQueue, type UploadItem } from '../hooks/useUploadQueue';
import { formatBytes } from '../lib/formatSeries';
import { UPLOAD_EXTENSIONS } from '../lib/uploadRules';

const STATUS_TONE: Record<UploadItem['status'], string> = {
	queued: 'text-text-muted',
	uploading: 'text-accent',
	done: 'text-success',
	failed: 'text-danger',
	refused: 'text-danger'
};

function statusText(item: UploadItem): string {
	if (item.status === 'queued') return 'Na fila';
	if (item.status === 'uploading') return `${item.percent}%`;
	if (item.status === 'done') return 'Enviado';
	return item.error ?? '';
}

function UploadRow({ item }: { item: UploadItem }) {
	return (
		<li data-testid={`upload-${item.name}`} className='flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0'>
			<span className='min-w-0 break-all text-text'>{item.name}</span>
			<span className='flex shrink-0 gap-3 font-mono text-xs'>
				<span className='text-text-muted'>{formatBytes(item.size)}</span>
				<span className={STATUS_TONE[item.status]}>{statusText(item)}</span>
			</span>
		</li>
	);
}

/**
 * Drop zone and file picker; files go up one at a time with their progress.
 * @example <UploadSection onUploaded={refreshFolder} />
 */
export function UploadSection({ onUploaded }: { onUploaded: () => void }) {
	const { items, add } = useUploadQueue(onUploaded);
	const [isDragging, setIsDragging] = useState(false);
	const drop = (event: DragEvent) => {
		event.preventDefault();
		setIsDragging(false);
		add(Array.from(event.dataTransfer.files));
	};
	return (
		<section aria-labelledby='upload-heading' className='space-y-3'>
			<h2 id='upload-heading' className='text-sm font-semibold text-text'>Enviar arquivos</h2>
			<div
				data-testid='upload-dropzone'
				onDragOver={(event) => {
					event.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={drop}
				className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors ${isDragging ? 'border-accent bg-accent/5' : 'border-border'}`}
			>
				<p className='text-text-muted'>{`Arraste episódios aqui (${UPLOAD_EXTENSIONS.join(', ')}, até 20 GB)`}</p>
				<label className={`cursor-pointer rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-raised ${FOCUS_RING}`}>
					Escolher arquivos
					<input
						type='file'
						multiple
						accept={UPLOAD_EXTENSIONS.join(',')}
						className='sr-only'
						onChange={(event) => {
							add(Array.from(event.target.files ?? []));
							event.target.value = '';
						}}
					/>
				</label>
			</div>
			{items.length > 0 && (
				<ul className='rounded-lg border border-border bg-surface px-3'>
					{items.map((item) => <UploadRow key={item.id} item={item} />)}
				</ul>
			)}
		</section>
	);
}
