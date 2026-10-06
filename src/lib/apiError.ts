import { isAxiosError } from 'axios';

/**
 * The message the API put in the error body, falling back to the transport
 * error, so toasts show "Manga 1 not found" rather than "status code 404".
 * @example toast.error(getApiErrorMessage(error))
 */
export function getApiErrorMessage(error: unknown): string {
	if (isAxiosError(error) || (typeof error === 'object' && error !== null && 'response' in error)) {
		const data = (error as { response?: { data?: unknown } }).response?.data;
		if (typeof data === 'string' && data) return data;
		if (data && typeof data === 'object' && 'message' in data) {
			const message = (data as { message: unknown }).message;
			if (Array.isArray(message)) return message.join('; ');
			if (typeof message === 'string') return message;
		}
	}
	return error instanceof Error ? error.message : String((error as { message?: unknown })?.message ?? error);
}

/**
 * HTTP status of a failed request, or null when the request never got a response.
 * @example if (getApiErrorStatus(error) === 409) showDuplicate()
 */
export function getApiErrorStatus(error: unknown): number | null {
	const status = (error as { response?: { status?: unknown } } | null)?.response?.status;
	return typeof status === 'number' ? status : null;
}
