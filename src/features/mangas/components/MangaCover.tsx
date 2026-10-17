import { useState } from 'react';

const MAX_INITIALS = 2;

/**
 * Up to two uppercase initials of the title, or '?' when it has no words.
 * @example coverInitials('O Cavaleiro em Eterna Regressão') // 'OC'
 */
function coverInitials(title: string): string {
	const initials = title
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, MAX_INITIALS)
		.map((word) => word[0].toUpperCase())
		.join('');
	return initials || '?';
}

interface MangaCoverProps {
	src: string;
	title: string;
	width?: number;
	height?: number;
	/** Empty alt for thumbnails sitting next to the title they would repeat. */
	isDecorative?: boolean;
	className?: string;
}

/**
 * Lazy cover image that falls back to the title initials when it fails.
 * @example <MangaCover src={mangaCoverUrl(7)} title='Black Clover' width={32} height={45} />
 */
export function MangaCover({ src, title, width = 48, height = 68, isDecorative = false, className = '' }: MangaCoverProps) {
	const [hasFailed, setHasFailed] = useState(false);
	const sizeCls = `shrink-0 rounded-sm border border-border bg-surface-raised ${className}`;
	if (hasFailed) {
		return (
			<span
				role={isDecorative ? undefined : 'img'}
				aria-label={isDecorative ? undefined : `Capa de ${title}`}
				aria-hidden={isDecorative || undefined}
				style={{ width, height }}
				className={`${sizeCls} inline-flex items-center justify-center text-xs font-semibold text-text-subtle`}
			>
				{coverInitials(title)}
			</span>
		);
	}
	return (
		<img
			src={src}
			alt={isDecorative ? '' : `Capa de ${title}`}
			width={width}
			height={height}
			loading='lazy'
			onError={() => setHasFailed(true)}
			style={{ width, height }}
			className={`${sizeCls} object-cover`}
		/>
	);
}
