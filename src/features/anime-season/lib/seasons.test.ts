import { describe, expect, it } from 'vitest';
import { currentSeason, shiftSeason } from './seasons';

describe('seasons', () => {
	it('current season follows the local month', () => {
		const cases: [Date, string][] = [
			[new Date(2026, 0, 1), 'winter'],
			[new Date(2026, 2, 31), 'winter'],
			[new Date(2026, 3, 1), 'spring'],
			[new Date(2026, 5, 30), 'spring'],
			[new Date(2026, 6, 1), 'summer'],
			[new Date(2026, 8, 30), 'summer'],
			[new Date(2026, 9, 1), 'fall'],
			[new Date(2026, 11, 31), 'fall']
		];
		for (const [date, season] of cases) expect(currentSeason(date)).toEqual({ year: 2026, season });
	});

	it('previous and next season wrap the year', () => {
		expect(shiftSeason({ year: 2026, season: 'fall' }, 1)).toEqual({ year: 2027, season: 'winter' });
		expect(shiftSeason({ year: 2026, season: 'winter' }, -1)).toEqual({ year: 2025, season: 'fall' });
		expect(shiftSeason({ year: 2026, season: 'spring' }, 1)).toEqual({ year: 2026, season: 'summer' });
	});
});
