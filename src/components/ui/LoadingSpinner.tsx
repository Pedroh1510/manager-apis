export function LoadingSpinner() {
	return (
		<div role='status' aria-label='Carregando' className='flex items-center justify-center p-8'>
			<div className='h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent' />
		</div>
	);
}
