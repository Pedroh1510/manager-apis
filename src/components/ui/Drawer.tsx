import { useEffect, useId, useRef, type ReactNode } from 'react';
import { FOCUS_RING } from './focusRing';

interface DrawerProps {
	open: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
}

const FOCUSABLE = 'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])';

/**
 * Side panel for forms that should not leave the current list.
 * @example <Drawer open={open} title='Adicionar item' onClose={close}>…</Drawer>
 */
export function Drawer({ open, title, onClose, children }: DrawerProps) {
	const titleId = useId();
	const panelRef = useRef<HTMLDivElement>(null);
	const openerRef = useRef<HTMLElement | null>(null);
	// Kept in a ref so a new onClose identity each render does not re-run the
	// open effect (which would steal focus back to the first field).
	const onCloseRef = useRef(onClose);
	useEffect(() => {
		onCloseRef.current = onClose;
	});

	useEffect(() => {
		if (!open) return;
		openerRef.current = document.activeElement as HTMLElement | null;
		const body = panelRef.current?.querySelector<HTMLElement>('[data-drawer-body]');
		body?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onCloseRef.current();
		};
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			openerRef.current?.focus();
		};
	}, [open]);

	if (!open) return null;

	return (
		<div className='fixed inset-0 z-50 flex justify-end'>
			<div data-testid='drawer-overlay' className='absolute inset-0 bg-black/40 animate-fade-in' onClick={onClose} />
			<div
				ref={panelRef}
				role='dialog'
				aria-modal='true'
				aria-labelledby={titleId}
				className='relative flex h-full w-full max-w-md animate-drawer-in flex-col border-l border-border bg-surface shadow-overlay'
			>
				<header className='flex h-12 items-center justify-between border-b border-border px-4'>
					<h2 id={titleId} className='text-sm font-semibold text-text'>
						{title}
					</h2>
					<button
						type='button'
						onClick={onClose}
						aria-label='Fechar painel'
						className={`rounded-sm px-1 text-text-muted hover:text-text ${FOCUS_RING}`}
					>
						✕
					</button>
				</header>
				<div data-drawer-body className='flex-1 overflow-y-auto p-4'>
					{children}
				</div>
			</div>
		</div>
	);
}
