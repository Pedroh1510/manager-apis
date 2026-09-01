import { Button } from './Button';

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	open,
	title,
	message,
	onConfirm,
	onCancel
}: ConfirmDialogProps) {
	if (!open) return null;

	return (
		<div
			role='dialog'
			aria-modal='true'
			aria-labelledby='confirm-dialog-title'
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity'
		>
			<div className='w-full max-w-sm rounded-lg border border-border bg-surface-raised p-6 shadow-overlay'>
				<h2
					id='confirm-dialog-title'
					className='mb-2 text-lg font-semibold text-text'
				>
					{title}
				</h2>
				<p className='mb-6 text-sm text-text-muted'>{message}</p>
				<div className='flex justify-end gap-3'>
					<Button variant='secondary' onClick={onCancel}>
						Cancelar
					</Button>
					<Button variant='danger' onClick={onConfirm}>
						Confirmar
					</Button>
				</div>
			</div>
		</div>
	);
}
