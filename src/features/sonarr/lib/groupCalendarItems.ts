import type { CalendarItem, CalendarStatus } from '../services/types';
import { formatEpisodeCode } from './formatSeries';

/** One line of a calendar day: a single episode, or a batch released together (decision Q12). */
export interface CalendarGroup {
	key: string;
	seriesId: number;
	seriesTitle: string;
	airDateUtc: string;
	/** `S01E05`, or `S02E01–E10 · 10 episódios` for a batch */
	label: string;
	/** null for a batch: ten titles do not fit a cell */
	episodeTitle: string | null;
	status: CalendarStatus;
}

/** What needs attention first: something missing outranks something not out yet. */
const STATUS_PRIORITY: CalendarStatus[] = ['missing', 'unaired', 'unmonitored', 'downloaded'];

function highestStatus(items: CalendarItem[]): CalendarStatus {
	return STATUS_PRIORITY.find((status) => items.some((item) => item.status === status)) ?? 'downloaded';
}

function compareEpisodes(a: CalendarItem, b: CalendarItem): number {
	return a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber;
}

/** `S02E01–E10` within a season, `S01E10–S02E01` across seasons. */
function rangeLabel(items: CalendarItem[]): string {
	const [first, last] = [items[0], items[items.length - 1]];
	const start = formatEpisodeCode(first.seasonNumber, first.episodeNumber);
	const end = formatEpisodeCode(last.seasonNumber, last.episodeNumber);
	const shortEnd = first.seasonNumber === last.seasonNumber ? end.slice(end.indexOf('E')) : end;
	return `${start}–${shortEnd} · ${items.length} episódios`;
}

function toGroup(key: string, items: CalendarItem[]): CalendarGroup {
	const sorted = [...items].sort(compareEpisodes);
	const [first] = sorted;
	const isSingle = sorted.length === 1;
	return {
		key,
		seriesId: first.seriesId,
		seriesTitle: first.seriesTitle,
		airDateUtc: first.airDateUtc,
		label: isSingle ? formatEpisodeCode(first.seasonNumber, first.episodeNumber) : rangeLabel(sorted),
		episodeTitle: isSingle ? first.title : null,
		status: highestStatus(sorted)
	};
}

/**
 * Same series at the same instant becomes one group; groups come by air time, then series title.
 * @example groupCalendarItems(items).map((group) => group.label) // ['S02E01–E10 · 10 episódios']
 */
export function groupCalendarItems(items: CalendarItem[]): CalendarGroup[] {
	const batches = new Map<string, CalendarItem[]>();
	for (const item of items) {
		const key = `${item.seriesId}@${item.airDateUtc}`;
		batches.set(key, [...(batches.get(key) ?? []), item]);
	}
	return [...batches]
		.map(([key, batch]) => toGroup(key, batch))
		.sort((a, b) => Date.parse(a.airDateUtc) - Date.parse(b.airDateUtc) || a.seriesTitle.localeCompare(b.seriesTitle));
}
