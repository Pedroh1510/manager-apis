import { describe, expect, it } from 'vitest';
import { localDayKey, parseWeekParam, shiftWeek, weekDays, weekWindow } from './calendarWeek';

// Wednesday 14/10/2026, 12:00 in America/Sao_Paulo (fixed in src/test/setup.ts).
const TODAY = new Date('2026-10-14T15:00:00Z');

describe('calendarWeek', () => {
	it('week param falls back to this week and snaps to sunday', () => {
		for (const raw of [null, '', 'abc', '2026-02-30']) expect(parseWeekParam(raw, TODAY), String(raw)).toBe('2026-10-11');
		expect(parseWeekParam('2026-10-04', TODAY)).toBe('2026-10-04');
		expect(parseWeekParam('2026-10-08', TODAY)).toBe('2026-10-04');
	});

	it('week window is local sunday midnight to next sunday in utc', () => {
		expect(weekWindow('2026-10-11')).toEqual({ start: '2026-10-11T03:00:00.000Z', end: '2026-10-18T03:00:00.000Z' });
	});

	it('shifts weeks across month and year boundaries', () => {
		expect(shiftWeek('2026-10-11', 1)).toBe('2026-10-18');
		expect(shiftWeek('2026-10-04', -1)).toBe('2026-09-27');
		expect(shiftWeek('2026-12-27', 1)).toBe('2027-01-03');
	});

	it('lists the seven local days and the local day of an instant', () => {
		expect(weekDays('2026-10-11').map((day) => day.key)).toEqual([
			'2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17'
		]);
		expect(localDayKey('2026-10-12T02:30:00Z')).toBe('2026-10-11');
	});
});
