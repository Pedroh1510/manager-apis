import { Button } from '../../../components/ui/Button';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { MIN_SEASON_YEAR, SEASON_LABELS, SEASON_NAMES, maxSeasonYear, shiftSeason, type SeasonRef } from '../lib/seasons';
import type { SeasonName } from '../services/types';

interface SeasonNavigationProps {
	value: SeasonRef;
	onGo: (season: SeasonRef) => void;
}

const selectCls = `h-8 rounded-md border border-border bg-surface px-2 text-sm text-text ${FOCUS_RING}`;

function yearOptions(today: Date): number[] {
	const max = maxSeasonYear(today);
	return Array.from({ length: max - MIN_SEASON_YEAR + 1 }, (_, index) => max - index);
}

/**
 * ‹ › between seasons plus year and season pickers, bounded by 1917 and next year (door 5).
 * @example <SeasonNavigation value={{ year: 2026, season: 'fall' }} onGo={go} />
 */
export function SeasonNavigation({ value, onGo }: SeasonNavigationProps) {
	const today = new Date();
	const isFirst = value.year === MIN_SEASON_YEAR && value.season === 'winter';
	const isLast = value.year === maxSeasonYear(today) && value.season === 'fall';
	return (
		<div className='flex items-center gap-1'>
			<Button aria-label='Temporada anterior' disabled={isFirst} onClick={() => onGo(shiftSeason(value, -1))}>‹</Button>
			<select aria-label='Estação' value={value.season} className={selectCls} onChange={(event) => onGo({ ...value, season: event.target.value as SeasonName })}>
				{SEASON_NAMES.map((season) => <option key={season} value={season}>{SEASON_LABELS[season]}</option>)}
			</select>
			<select aria-label='Ano' value={value.year} className={selectCls} onChange={(event) => onGo({ ...value, year: Number(event.target.value) })}>
				{yearOptions(today).map((year) => <option key={year} value={year}>{year}</option>)}
			</select>
			<Button aria-label='Próxima temporada' disabled={isLast} onClick={() => onGo(shiftSeason(value, 1))}>›</Button>
		</div>
	);
}
