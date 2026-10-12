/** `YYYY-MM-DD` of a local day; the week in the URL is the key of its Sunday (door 4). */
export type DayKey = string;

export interface WeekDay {
	key: DayKey;
	date: Date;
}

const DAYS_PER_WEEK = 7;
const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number) => String(n).padStart(2, '0');

function toDayKey(date: Date): DayKey {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of a key; null for anything that is not a real calendar day, e.g. 2026-02-30. */
function fromDayKey(key: string): Date | null {
	const match = DAY_KEY.exec(key);
	if (!match) return null;
	const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	return toDayKey(date) === key ? date : null;
}

function sundayOf(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}

/** Built from parts, not by adding ms, so a daylight-saving week still starts at local midnight. */
function addDays(key: DayKey, days: number): Date {
	const date = fromDayKey(key) as Date;
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Absent or invalid falls back to the current week; any day snaps to its Sunday.
 * @example parseWeekParam('2026-10-08', new Date()) // '2026-10-04'
 */
export function parseWeekParam(raw: string | null, today: Date): DayKey {
	const date = raw ? fromDayKey(raw) : null;
	return toDayKey(sundayOf(date ?? today));
}

/** @example shiftWeek('2026-12-27', 1) // '2027-01-03' */
export function shiftWeek(week: DayKey, weeks: number): DayKey {
	return toDayKey(addDays(week, weeks * DAYS_PER_WEEK));
}

/**
 * Local Sunday 00:00 to the next Sunday 00:00, as UTC instants for `GET /api/sonarr/calendar`.
 * @example weekWindow('2026-10-11') // { start: '2026-10-11T03:00:00.000Z', end: '2026-10-18T03:00:00.000Z' } in São Paulo
 */
export function weekWindow(week: DayKey): { start: string; end: string } {
	return { start: addDays(week, 0).toISOString(), end: addDays(week, DAYS_PER_WEEK).toISOString() };
}

/** @example weekDays('2026-10-11')[6].key // '2026-10-17' */
export function weekDays(week: DayKey): WeekDay[] {
	return Array.from({ length: DAYS_PER_WEEK }, (_, offset) => {
		const date = addDays(week, offset);
		return { key: toDayKey(date), date };
	});
}

/** The viewer's local day of an instant. @example localDayKey('2026-10-12T02:30:00Z') // '2026-10-11' in São Paulo */
export function localDayKey(iso: string): DayKey {
	return toDayKey(new Date(iso));
}
