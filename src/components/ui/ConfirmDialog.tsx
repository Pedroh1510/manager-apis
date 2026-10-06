import type { ReactNode } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
	/** Extra detail under the message, e.g. the list of items the action touches. */
	children?: ReactNode;
}

export function ConfirmDialog({
	open,
	title,
	message,
	onConfirm,
	onCancel,
	children
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
				<p className='mb-4 text-sm text-text-muted'>{message}</p>
				{children && <div className='mb-6'>{children}</div>}
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
