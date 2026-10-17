import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { scorePercent } from '../lib/coverSuggestions';
import { catalogCoverUrl } from '../services/coverUrls';
import type { CoverSuggestion, CoverSuggestionConflict } from '../services/types';
import { MangaCover } from './MangaCover';

const BAND_LABEL = { strong: 'Forte', possible: 'Possível' } as const;
const BAND_VARIANT = { strong: 'success', possible: 'warning' } as const;

interface SuggestionCardProps {
	suggestion: CoverSuggestion | CoverSuggestionConflict;
	pluginName: string;
	isBusy: boolean;
	onAccept?: () => void;
	onDismiss: () => void;
}

function isConflict(suggestion: CoverSuggestion): suggestion is CoverSuggestionConflict {
	return 'conflictIdManga' in suggestion;
}

/**
 * One catalog candidate: its cover, title, connector, score and band, with
 * accept (omitted for conflicts) and dismiss.
 * @example <SuggestionCard suggestion={s} pluginName='Nexus Toons' isBusy={false} onAccept={...} onDismiss={...} />
 */
export function SuggestionCard({ suggestion, pluginName, isBusy, onAccept, onDismiss }: SuggestionCardProps) {
	return (
		<li data-testid='suggestion' className='flex items-center gap-3 rounded-md border border-border bg-surface p-2'>
			<MangaCover
				src={catalogCoverUrl(suggestion.idPlugin, suggestion.idMangaPlugin)}
				title={suggestion.titlePlugin}
				width={48}
				height={68}
			/>
			<div className='min-w-0 flex-1'>
				<p className='truncate text-sm font-medium text-text'>{suggestion.titlePlugin}</p>
				<p className='text-xs text-text-muted'>{pluginName}</p>
				{isConflict(suggestion) && (
					<p className='mt-0.5 text-xs text-text-muted'>
						Já ligado a{' '}
						<Link
							to={`/mangas/${suggestion.conflictIdManga}`}
							className={`rounded-sm text-accent hover:underline ${FOCUS_RING}`}
						>
							{suggestion.conflictTitle}
						</Link>
					</p>
				)}
			</div>
			<span className='font-mono text-sm tabular-nums text-text'>{scorePercent(suggestion.score)}</span>
			<Badge variant={BAND_VARIANT[suggestion.band]}>{BAND_LABEL[suggestion.band]}</Badge>
			<div className='flex gap-1.5'>
				{onAccept && (
					<Button size='sm' variant='primary' disabled={isBusy} onClick={onAccept}>
						Aceitar
					</Button>
				)}
				<Button size='sm' variant='ghost' disabled={isBusy} onClick={onDismiss}>
					Recusar
				</Button>
			</div>
		</li>
	);
}
