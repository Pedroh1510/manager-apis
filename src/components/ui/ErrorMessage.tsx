interface ErrorMessageProps {
	message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
	return (
		<div className='rounded-md bg-red-50 p-4 text-sm text-red-700'>
			<strong>Erro:</strong> {message}
		</div>
	);
}
