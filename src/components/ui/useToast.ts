import { createContext, useContext } from 'react';

/** A link inside a toast; `onFollow` lets a page navigate in-app (the provider sits outside the router). */
export interface ToastAction {
	label: string;
	href: string;
	onFollow?: (href: string) => void;
}

export interface ToastApi {
	success: (text: string, action?: ToastAction) => void;
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
