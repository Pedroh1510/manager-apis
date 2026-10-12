import { useState } from 'react';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { formatSeasonSuffix } from '../lib/alternateTitles';
import type { AlternateTitle } from '../services/types';

/** Past this, scene-heavy anime would push the overview off the first screen (decision Q14). */
const VISIBLE_TITLES = 5;

/**
 * "Também conhecida como" under the series title; absent when Sonarr knows no other name.
 * @example <AlternateTitlesLine titles={series.alternateTitles} />
 */
export function AlternateTitlesLine({ titles }: { titles: AlternateTitle[] }) {
	const [isExpanded, setIsExpanded] = useState(false);
	if (titles.length === 0) return null;
	const hidden = isExpanded ? 0 : Math.max(0, titles.length - VISIBLE_TITLES);
	const shown = titles.slice(0, titles.length - hidden);
	const text = shown.map((alternate) => `${alternate.title}${formatSeasonSuffix(alternate.seasonNumbers)}`).join(' · ');
	return (
		<p className='max-w-3xl text-sm text-text-muted'>
			{`Também conhecida como: ${text}`}
			{hidden > 0 && (
				<button
					type='button'
					onClick={() => setIsExpanded(true)}
					className={`ml-2 rounded px-1 text-xs font-medium text-accent hover:underline ${FOCUS_RING}`}
				>
					{`+${hidden}`}
				</button>
			)}
		</p>
	);
}
