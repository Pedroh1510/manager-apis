import { useState } from 'react';
import { initialsOf } from '../lib/formatSeries';

interface PosterImageProps {
	/** null goes straight to the initials. */
	src: string | null;
	title: string;
	/** Width (and any extra) classes, e.g. `w-full` in a card or `w-32` in the detail. */
	className: string;
}

/**
 * A 2:3 poster, or the title initials when there is none or it fails to load.
 * @example <PosterImage src='https://artworks.thetvdb.com/p.jpg' title='Severance' className='w-24' />
 */
export function PosterImage({ src, title, className }: PosterImageProps) {
	const [hasFailed, setHasFailed] = useState(false);
	const frame = `aspect-[2/3] rounded-md border border-border bg-surface-raised ${className}`;
	if (hasFailed || !src) {
		return (
			<div className={`${frame} grid place-items-center font-mono text-2xl font-semibold text-text-subtle`} aria-label={`Sem pôster: ${title}`}>
				{initialsOf(title)}
			</div>
		);
	}
	return <img src={src} alt={`Pôster de ${title}`} loading='lazy' onError={() => setHasFailed(true)} className={`${frame} object-cover`} />;
}
