import { useEffect, useRef } from 'react';
import { getApiErrorMessage } from '../../lib/apiError';
import { useToast } from './useToast';

/**
 * Toasts a query's error once per failure, so read failures report the same
 * way mutation failures do.
 * @example useErrorToast(chapters.error)
 */
export function useErrorToast(error: unknown): void {
	const toast = useToast();
	// StrictMode runs effects twice in development; one toast per error object.
	const lastReported = useRef<unknown>(null);
	useEffect(() => {
		if (!error || lastReported.current === error) return;
		lastReported.current = error;
		toast.error(getApiErrorMessage(error));
	}, [error, toast]);
}
