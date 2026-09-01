import { Alert } from './Alert';

interface ErrorMessageProps {
	message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
	return (
		<Alert variant="danger">
			<strong>Erro:</strong> {message}
		</Alert>
	);
}
