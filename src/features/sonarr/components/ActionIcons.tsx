import type { ReactNode } from 'react';
import { FOCUS_RING } from '../../../components/ui/focusRing';

const ICON_PROPS = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true } as const;

function SearchIcon() {
	return (
		<svg {...ICON_PROPS}>
			<circle cx='11' cy='11' r='7' />
			<path d='m20 20-3.5-3.5' />
		</svg>
	);
}

function InteractiveIcon() {
	return (
		<svg {...ICON_PROPS}>
			<circle cx='12' cy='8' r='4' />
			<path d='M4 21c0-4 4-6 8-6s8 2 8 6' />
		</svg>
	);
}

interface IconButtonProps {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	children: ReactNode;
}

function IconButton({ label, onClick, disabled = false, children }: IconButtonProps) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			onClick={onClick}
			disabled={disabled}
			className={`grid h-7 w-7 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface-raised hover:text-text disabled:cursor-wait disabled:opacity-40 ${FOCUS_RING}`}
		>
			{children}
		</button>
	);
}

interface SearchActionsProps {
	/** `S01E03` or `Temporada 1`: completes each button's accessible name. */
	subject: string;
	isSearching: boolean;
	onSearch: () => void;
	onInteractive: () => void;
}

/**
 * Icon-only "Buscar" and "Busca interativa" buttons, as in Sonarr's own UI.
 * @example <SearchActions subject='S01E03' isSearching={false} onSearch={...} onInteractive={...} />
 */
export function SearchActions({ subject, isSearching, onSearch, onInteractive }: SearchActionsProps) {
	return (
		<span className='inline-flex gap-1'>
			<IconButton label={`Buscar ${subject}`} onClick={onSearch} disabled={isSearching}>
				<SearchIcon />
			</IconButton>
			<IconButton label={`Busca interativa ${subject}`} onClick={onInteractive}>
				<InteractiveIcon />
			</IconButton>
		</span>
	);
}
