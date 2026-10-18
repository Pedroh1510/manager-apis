import { describe, expect, it } from 'vitest';
import { seasonItem } from '../test/fixtures';
import { filterSeasonItems } from './filterSeasonItems';

const ITEMS = [
	seasonItem({ malId: 1 }),
	seasonItem({ malId: 2, title: 'Kusuriya no Hitorigoto', titleEnglish: 'The Apothecary Diaries' }),
	seasonItem({ malId: 3, title: 'Dandadan', titleEnglish: null })
];
const found = (search: string) => filterSeasonItems(ITEMS, search).map(({ malId }) => malId);

describe('filterSeasonItems', () => {
	it('matches title and english title ignoring case and accents', () => {
		expect(found('sousou')).toEqual([1]);
		expect(found('FRIEREN')).toEqual([1]);
		expect(found('kusuriya')).toEqual([2]);
		expect(found('sôusou')).toEqual([1]);
		expect(found('apothecary')).toEqual([2]);
		expect(found('  ')).toEqual([1, 2, 3]);
		expect(found('naruto')).toEqual([]);
	});
});
