import { describe, expect, it } from 'vitest';
import { seasonItem } from '../test/fixtures';
import { groupByWeekday, sortSeasonItems } from './sortSeasonItems';

const ids = (items: { id: number }[]) => items.map(({ id }) => id);

describe('sortSeasonItems', () => {
	it('sorts by popularity, score and weekday', () => {
		const items = [
			seasonItem({ id: 1, members: 100, score: null, broadcast: null }),
			seasonItem({ id: 2, members: 900, score: 7.1, broadcast: { day: 'sunday', time: '01:00' } }),
			seasonItem({ id: 3, members: 500, score: 8.4, broadcast: { day: 'monday', time: '23:30' } }),
			seasonItem({ id: 4, members: 300, score: 6.0, broadcast: { day: 'monday', time: '22:00' } }),
			seasonItem({ id: 5, members: 700, score: 9.0, broadcast: { day: 'monday', time: '22:00' } })
		];

		expect(ids(sortSeasonItems(items, 'popularity'))).toEqual([2, 5, 3, 4, 1]);
		expect(ids(sortSeasonItems(items, 'score'))).toEqual([5, 3, 2, 4, 1]);
		expect(ids(sortSeasonItems(items, 'weekday'))).toEqual([5, 4, 3, 2, 1]);
		expect(ids(items)).toEqual([1, 2, 3, 4, 5]);

		expect(groupByWeekday(items).map(({ day, items: dayItems }) => [day, ids(dayItems)])).toEqual([
			['monday', [5, 4, 3]],
			['sunday', [2]],
			[null, [1]]
		]);
	});
});
