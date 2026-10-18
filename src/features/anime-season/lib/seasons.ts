import type { SeasonName } from '../services/types';

export interface SeasonRef {
	year: number;
	season: SeasonName;
}

export const SEASON_NAMES: SeasonName[] = ['winter', 'spring', 'summer', 'fall'];
export const SEASON_LABELS: Record<SeasonName, string> = { winter: 'Inverno', spring: 'Primavera', summer: 'Verão', fall: 'Outono' };
/** The oldest season MAL lists; the server rejects anything before it. */
export const MIN_SEASON_YEAR = 1917;

const MONTHS_PER_SEASON = 3;

/**
 * The season of a local date: jan–mar winter, abr–jun spring, jul–set summer, out–dez fall.
 * @example currentSeason(new Date(2026, 9, 18)) // { year: 2026, season: 'fall' }
 */
export function currentSeason(today: Date): SeasonRef {
	return { year: today.getFullYear(), season: SEASON_NAMES[Math.floor(today.getMonth() / MONTHS_PER_SEASON)] };
}

/** Next year is the furthest MAL usually lists, and the server's own bound. */
export function maxSeasonYear(today: Date): number {
	return today.getFullYear() + 1;
}

/**
 * The season `delta` steps away, wrapping the year.
 * @example shiftSeason({ year: 2026, season: 'fall' }, 1) // { year: 2027, season: 'winter' }
 */
export function shiftSeason(ref: SeasonRef, delta: number): SeasonRef {
	const index = ref.year * SEASON_NAMES.length + SEASON_NAMES.indexOf(ref.season) + delta;
	return { year: Math.floor(index / SEASON_NAMES.length), season: SEASON_NAMES[index % SEASON_NAMES.length] };
}

/** "Outono 2026" */
export function seasonTitle({ year, season }: SeasonRef): string {
	return `${SEASON_LABELS[season]} ${year}`;
}
