import { describe, expect, it } from 'vitest';
import { sortSeries } from './sortSeries';
import type { SeriesSummary } from '../services/types';

function series(id: number, overrides: Partial<SeriesSummary>): SeriesSummary {
	return { id, title: `S${id}`, alternateTitles: [], year: 2000, status: 'ended', network: '', episodeFileCount: 0, episodeCount: 0, added: '', ...overrides };
}

const ids = (list: SeriesSummary[]) => list.map((item) => item.id);

describe('sortSeries', () => {
	it('sorts by year, missing and added, newest or most missing first', () => {
		const byYear = [series(1, { year: 2002 }), series(2, { year: 2021 }), series(3, { year: 2010 })];
		expect(ids(sortSeries(byYear, 'title'))).toEqual([1, 2, 3]);
		expect(ids(sortSeries(byYear, 'year'))).toEqual([2, 3, 1]);

		const byMissing = [
			series(1, { episodeCount: 10, episodeFileCount: 10 }),
			series(2, { episodeCount: 10, episodeFileCount: 5 }),
			series(3, { episodeCount: 10, episodeFileCount: 8 }),
		];
		expect(ids(sortSeries(byMissing, 'missing'))).toEqual([2, 3, 1]);

		const byAdded = [
			series(1, { added: '2020-01-01T00:00:00Z' }),
			series(2, { added: '2024-03-01T00:00:00Z' }),
			series(3, { added: '2022-06-01T00:00:00Z' }),
		];
		expect(ids(sortSeries(byAdded, 'added'))).toEqual([2, 3, 1]);
	});

	it('keeps title order on ties', () => {
		const tied = [series(1, { year: 2010 }), series(2, { year: 2010 }), series(3, { year: 2020 })];
		expect(ids(sortSeries(tied, 'year'))).toEqual([3, 1, 2]);
	});

	it('does not mutate the received list', () => {
		const list = [series(1, { year: 2000 }), series(2, { year: 2020 })];
		sortSeries(list, 'year');
		expect(ids(list)).toEqual([1, 2]);
	});
});
