import { useState } from 'react';
import { initialsOf } from '../lib/formatSeries';
import { seriesPosterUrl } from '../services/api';

interface SeriesPosterProps {
	seriesId: number;
	title: string;
	className?: string;
}

/**
 * Sonarr's local poster through server/, or the title initials when it fails to load.
 * @example <SeriesPoster seriesId={1} title='The Wire' />
 */
export function SeriesPoster({ seriesId, title, className = '' }: SeriesPosterProps) {
	const [hasFailed, setHasFailed] = useState(false);
	const frame = `aspect-[2/3] w-full rounded-md border border-border bg-surface-raised ${className}`;
	if (hasFailed) {
		return (
			<div className={`${frame} grid place-items-center font-mono text-2xl font-semibold text-text-subtle`} aria-label={`Sem pôster: ${title}`}>
				{initialsOf(title)}
			</div>
		);
	}
	return (
		<img
			src={seriesPosterUrl(seriesId)}
			alt={`Pôster de ${title}`}
			loading='lazy'
			onError={() => setHasFailed(true)}
			className={`${frame} object-cover`}
		/>
	);
}
