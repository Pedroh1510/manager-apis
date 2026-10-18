import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { STATUS_LABELS, formatBroadcast, formatCount, formatEpisodes, formatPremiere, formatScore } from '../lib/formatSeasonCard';
import type { AnimeSeasonItem } from '../services/types';

interface AnimeSeasonCardProps {
	item: AnimeSeasonItem;
	/** Upcoming cards show the premiere date instead of the weekly slot. */
	isUpcoming: boolean;
	isSonarrOn: boolean;
}

const COVER_WIDTH = 225;
const COVER_HEIGHT = 338;
const linkCls = `rounded text-xs font-medium text-accent hover:underline ${FOCUS_RING}`;

function Cover({ item }: { item: AnimeSeasonItem }) {
	if (!item.imageUrl) return <div aria-hidden='true' className='aspect-[2/3] w-full bg-surface-raised' />;
	return (
		<img src={item.imageUrl} alt={item.title} loading='lazy' width={COVER_WIDTH} height={COVER_HEIGHT}
			className='aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]' />
	);
}

function ScoreLine({ item }: { item: AnimeSeasonItem }) {
	if (item.score === null) return <span className='text-text-subtle'>Sem score</span>;
	return (
		<span className='flex items-baseline gap-1'>
			<span className='font-mono text-sm font-semibold text-text'>{formatScore(item.score)}</span>
			{item.scoredBy !== null && <span className='text-text-subtle'>{formatCount(item.scoredBy)}</span>}
		</span>
	);
}

function Synopsis({ synopsis }: { synopsis: string | null }) {
	const [isOpen, setOpen] = useState(false);
	const panelId = useId();
	return (
		<div>
			<button type='button' aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen(!isOpen)} className={`text-xs text-text-muted hover:text-text ${FOCUS_RING}`}>
				Sinopse
			</button>
			{isOpen && <p id={panelId} className='mt-1 whitespace-pre-line text-xs leading-relaxed text-text-muted'>{synopsis ?? 'Sem sinopse'}</p>}
		</div>
	);
}

function sonarrSearchPath(item: AnimeSeasonItem): string {
	return `/sonarr/adicionar?q=${encodeURIComponent(item.titleEnglish ?? item.title)}`;
}

/**
 * One anime of the season grid: cover, titles, score, slot, studios, genres, synopsis and links (decision Q8).
 * @example <AnimeSeasonCard item={item} isUpcoming={false} isSonarrOn />
 */
export function AnimeSeasonCard({ item, isUpcoming, isSonarrOn }: AnimeSeasonCardProps) {
	const hasEnglishTitle = item.titleEnglish !== null && item.titleEnglish !== item.title;
	const slot = isUpcoming ? formatPremiere(item.airedFrom) : item.broadcast && formatBroadcast(item.broadcast);
	return (
		<article data-testid='season-card' className='group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-raised'>
			<div className='overflow-hidden'><Cover item={item} /></div>
			<div className='flex flex-1 flex-col gap-1.5 p-2.5'>
				<h3 className='text-sm font-semibold leading-snug text-text'>{item.title}</h3>
				{hasEnglishTitle && <p className='text-xs leading-snug text-text-muted'>{item.titleEnglish}</p>}
				<div className='flex flex-wrap items-center justify-between gap-x-2 text-xs'>
					<ScoreLine item={item} />
					<span className='text-text-muted'>{formatEpisodes(item.episodes)}</span>
				</div>
				<p className='text-xs text-text-muted'>
					{slot && <span className='font-medium text-text'>{slot}</span>}
					{item.status && !isUpcoming && <span> · {STATUS_LABELS[item.status]}</span>}
				</p>
				{item.studios.length > 0 && <p className='text-xs text-text-subtle'>{item.studios.join(', ')}</p>}
				<ul className='flex flex-wrap gap-1'>
					{item.genres.map((genre) => <li key={genre} className='rounded-sm bg-surface-raised px-1.5 py-0.5 text-[11px] text-text-muted'>{genre}</li>)}
				</ul>
				<Synopsis synopsis={item.synopsis} />
				<div className='mt-auto flex items-center justify-between gap-2 border-t border-border pt-2'>
					<a href={item.url} target='_blank' rel='noopener noreferrer' className={linkCls}>MAL</a>
					{isSonarrOn && <Link to={sonarrSearchPath(item)} className={linkCls}>Adicionar no Sonarr</Link>}
				</div>
			</div>
		</article>
	);
}
