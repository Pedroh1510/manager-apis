import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FOCUS_RING } from './focusRing';
import { ToastContext, type ToastAction, type ToastApi } from './useToast';

type ToastKind = 'success' | 'error';

interface ToastItem {
	id: number;
	kind: ToastKind;
	text: string;
	action?: ToastAction;
}

// Success confirms and gets out of the way; an error waits until it was read.
const SUCCESS_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<ToastItem[]>([]);
	const nextId = useRef(0);

	const dismiss = useCallback((id: number) => {
		setItems((current) => current.filter((item) => item.id !== id));
	}, []);

	const push = useCallback((kind: ToastKind, text: string, action?: ToastAction) => {
		nextId.current += 1;
		const item = { id: nextId.current, kind, text, action };
		setItems((current) => [...current, item]);
	}, []);

	const api = useMemo<ToastApi>(
		() => ({ success: (text, action) => push('success', text, action), error: (text) => push('error', text) }),
		[push]
	);

	return (
		<ToastContext.Provider value={api}>
			{children}
			<div data-toast-region className='pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2'>
				{items.map((item) => (
					<ToastMessage key={item.id} item={item} onDismiss={dismiss} />
				))}
			</div>
		</ToastContext.Provider>
	);
}

const kindClasses: Record<ToastKind, string> = {
	success: 'border-l-success',
	error: 'border-l-danger'
};

function ToastMessage({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
	useEffect(() => {
		if (item.kind !== 'success') return;
		const timer = setTimeout(() => onDismiss(item.id), SUCCESS_DURATION_MS);
		return () => clearTimeout(timer);
	}, [item, onDismiss]);

	return (
		<div
			role={item.kind === 'success' ? 'status' : 'alert'}
			className={`pointer-events-auto flex animate-toast-in items-start gap-3 rounded-md border border-l-2 border-border bg-surface px-3 py-2.5 text-sm text-text shadow-overlay ${kindClasses[item.kind]}`}
		>
			<p className='flex-1'>{item.text}</p>
			{item.action && <ToastLink action={item.action} />}
			{item.kind === 'error' && (
				<button
					type='button'
					onClick={() => onDismiss(item.id)}
					className={`rounded-sm text-xs text-text-muted hover:text-text ${FOCUS_RING}`}
				>
					Fechar
				</button>
			)}
		</div>
	);
}

function ToastLink({ action }: { action: ToastAction }) {
	const { label, href, onFollow } = action;
	return (
		<a
			href={href}
			onClick={(event) => {
				if (!onFollow) return;
				event.preventDefault();
				onFollow(href);
			}}
			className={`rounded-sm text-xs font-medium text-accent hover:underline ${FOCUS_RING}`}
		>
			{label}
		</a>
	);
}
