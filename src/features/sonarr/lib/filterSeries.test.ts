import { describe, expect, it } from 'vitest';
import { matchesSeriesQuery } from './filterSeries';

const acao = { title: 'Ação Total', alternateTitles: ['Action Total'] };
const wire = { title: 'The Wire', alternateTitles: [] };

describe('matchesSeriesQuery', () => {
	it('matches title and alternate titles ignoring case and accents', () => {
		expect(matchesSeriesQuery(acao, 'acao')).toBe(true);
		expect(matchesSeriesQuery(acao, 'ACTION')).toBe(true);
		expect(matchesSeriesQuery(wire, 'wire')).toBe(true);
		expect(matchesSeriesQuery(wire, 'xyz')).toBe(false);
		expect(matchesSeriesQuery(wire, '')).toBe(true);
	});
});
