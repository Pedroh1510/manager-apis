import { describe, expect, it } from 'vitest';
import type { CalendarItem, CalendarStatus } from '../services/types';
import { groupCalendarItems } from './groupCalendarItems';

function item(overrides: Partial<CalendarItem>): CalendarItem {
	return {
		episodeId: 1, seriesId: 7, seriesTitle: 'Andor', seasonNumber: 2, episodeNumber: 1, title: 'Ep',
		airDateUtc: '2026-10-15T07:00:00Z', status: 'downloaded', ...overrides
	};
}

describe('groupCalendarItems', () => {
	it('groups same series and air time with a range label', () => {
		const season = Array.from({ length: 10 }, (_, index) => item({ episodeId: 100 + index, episodeNumber: index + 1 }));
		const crossing = [
			item({ episodeId: 1, seriesId: 8, seriesTitle: 'Zorro', seasonNumber: 1, episodeNumber: 10, airDateUtc: '2026-10-16T01:00:00Z' }),
			item({ episodeId: 2, seriesId: 8, seriesTitle: 'Zorro', seasonNumber: 2, episodeNumber: 1, airDateUtc: '2026-10-16T01:00:00Z' })
		];
		const groups = groupCalendarItems([...season, ...crossing]);
		expect(groups.map((group) => group.label)).toEqual(['S02E01–E10 · 10 episódios', 'S01E10–S02E01 · 2 episódios']);
		expect(groups[0].episodeTitle).toBeNull();
	});

	it('keeps different times and different series apart', () => {
		const groups = groupCalendarItems([
			item({ episodeId: 1, episodeNumber: 1 }),
			item({ episodeId: 2, episodeNumber: 2, airDateUtc: '2026-10-15T08:00:00Z' }),
			item({ episodeId: 3, seriesId: 9, seriesTitle: 'Bluey', episodeNumber: 3 })
		]);
		expect(groups.map((group) => [group.seriesTitle, group.label, group.episodeTitle])).toEqual([
			['Andor', 'S02E01', 'Ep'],
			['Bluey', 'S02E03', 'Ep'],
			['Andor', 'S02E02', 'Ep']
		]);
	});

	it('group status takes the highest priority', () => {
		const cases: [CalendarStatus[], CalendarStatus][] = [
			[['downloaded', 'unmonitored', 'unaired', 'missing'], 'missing'],
			[['downloaded', 'unmonitored', 'unaired'], 'unaired'],
			[['downloaded', 'unmonitored'], 'unmonitored'],
			[['downloaded', 'downloaded'], 'downloaded']
		];
		for (const [statuses, expected] of cases) {
			const items = statuses.map((status, index) => item({ episodeId: index + 1, episodeNumber: index + 1, status }));
			expect(groupCalendarItems(items)[0].status, statuses.join()).toBe(expected);
		}
	});

	it('orders a day by time then series title', () => {
		const groups = groupCalendarItems([
			item({ seriesId: 1, seriesTitle: 'Zorro', airDateUtc: '2026-10-16T00:00:00Z' }),
			item({ seriesId: 2, seriesTitle: 'Andor', airDateUtc: '2026-10-16T00:00:00Z' }),
			item({ seriesId: 1, seriesTitle: 'Zorro', airDateUtc: '2026-10-15T23:00:00Z' })
		]);
		expect(groups.map((group) => `${group.seriesTitle} ${group.airDateUtc}`)).toEqual([
			'Zorro 2026-10-15T23:00:00Z', 'Andor 2026-10-16T00:00:00Z', 'Zorro 2026-10-16T00:00:00Z'
		]);
	});
});
