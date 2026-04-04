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
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
		>
			<div className='w-full max-w-sm rounded-lg bg-white p-6 shadow-xl'>
				<h2
					id='confirm-dialog-title'
					className='mb-2 text-lg font-semibold text-gray-900'
				>
					{title}
				</h2>
				<p className='mb-6 text-sm text-gray-600'>{message}</p>
				<div className='flex justify-end gap-3'>
					<button
						onClick={onCancel}
						className='rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50'
					>
						Cancelar
					</button>
					<button
						onClick={onConfirm}
						className='rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700'
					>
						Confirmar
					</button>
				</div>
			</div>
		</div>
	);
}
