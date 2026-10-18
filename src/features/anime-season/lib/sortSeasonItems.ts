import type { AnimeSeasonItem, Weekday } from '../services/types';
import type { SeasonSort } from './seasonParams';

export const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export interface WeekdayGroup {
	/** null: "Sem dia definido". */
	day: Weekday | null;
	items: AnimeSeasonItem[];
}

const byMembers = (a: AnimeSeasonItem, b: AnimeSeasonItem) => (b.members ?? 0) - (a.members ?? 0);

function byScore(a: AnimeSeasonItem, b: AnimeSeasonItem): number {
	if (a.score === b.score) return byMembers(a, b);
	if (a.score === null) return 1;
	if (b.score === null) return -1;
	return b.score - a.score;
}

const dayIndex = (item: AnimeSeasonItem) => (item.broadcast ? WEEKDAYS.indexOf(item.broadcast.day) : WEEKDAYS.length);

function byWeekday(a: AnimeSeasonItem, b: AnimeSeasonItem): number {
	const days = dayIndex(a) - dayIndex(b);
	if (days !== 0) return days;
	return (a.broadcast?.time ?? '').localeCompare(b.broadcast?.time ?? '') || byMembers(a, b);
}

const COMPARATORS: Record<SeasonSort, (a: AnimeSeasonItem, b: AnimeSeasonItem) => number> = { popularity: byMembers, score: byScore, weekday: byWeekday };

/**
 * A sorted copy: popularity by members, score with nulls last, weekday Monday → Sunday then no day.
 * @example sortSeasonItems(items, 'score')[0].score // the highest score
 */
export function sortSeasonItems(items: AnimeSeasonItem[], sort: SeasonSort): AnimeSeasonItem[] {
	return [...items].sort(COMPARATORS[sort]);
}

/**
 * Weekday blocks for the "dia" sort; only days that have items, "no day" last.
 * @example groupByWeekday(sortSeasonItems(items, 'weekday')).map(({ day }) => day) // ['saturday', null]
 */
export function groupByWeekday(items: AnimeSeasonItem[]): WeekdayGroup[] {
	const sorted = sortSeasonItems(items, 'weekday');
	return [...WEEKDAYS, null]
		.map((day) => ({ day, items: sorted.filter((item) => (item.broadcast?.day ?? null) === day) }))
		.filter(({ items: dayItems }) => dayItems.length > 0);
}
