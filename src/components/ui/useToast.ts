import { createContext, useContext } from 'react';

export interface ToastApi {
	success: (text: string) => void;
	error: (text: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

/**
 * Feedback for mutation results, shared by every screen.
 * @example const toast = useToast(); toast.success('Conectores ativados')
 */
export function useToast(): ToastApi {
	const api = useContext(ToastContext);
	if (!api) throw new Error('useToast must be used inside <ToastProvider>, got no provider in the tree');
	return api;
}
