import { describe, expect, it } from 'vitest';
import { parseSeasonParams, seasonParamsToSearch } from './seasonParams';

const TODAY = new Date(2026, 9, 18);
const parse = (query: string) => parseSeasonParams(new URLSearchParams(query), TODAY);
const DEFAULTS = { year: 2026, season: 'fall', type: 'tv', sort: 'popularity', tab: 'season' };

describe('seasonParams', () => {
	it('parses url params and falls back to defaults', () => {
		expect(parse('ano=2025&estacao=verao&tipo=filme&ordem=score')).toEqual({ year: 2025, season: 'summer', type: 'movie', sort: 'score', tab: 'season' });
		expect(parse('')).toEqual(DEFAULTS);

		const seasons = { inverno: 'winter', primavera: 'spring', verao: 'summer', outono: 'fall' };
		for (const [word, season] of Object.entries(seasons)) expect(parse(`estacao=${word}`).season).toBe(season);
		const types = { tv: 'tv', ona: 'ona', filme: 'movie', ova: 'ova', especial: 'special' };
		for (const [word, type] of Object.entries(types)) expect(parse(`tipo=${word}`).type).toBe(type);
		const sorts = { popularidade: 'popularity', score: 'score', dia: 'weekday' };
		for (const [word, sort] of Object.entries(sorts)) expect(parse(`ordem=${word}`).sort).toBe(sort);
		expect(parse('aba=anunciados').tab).toBe('upcoming');

		for (const invalid of ['ano=1800', 'ano=x', 'ano=2028', 'estacao=autumn', 'tipo=music', 'ordem=nome', 'aba=x']) {
			expect(parse(invalid)).toEqual(DEFAULTS);
		}
	});

	it('writes only the values that differ from the defaults', () => {
		expect(seasonParamsToSearch(parse(''), TODAY).toString()).toBe('');
		expect(seasonParamsToSearch({ year: 2027, season: 'winter', type: 'special', sort: 'weekday', tab: 'upcoming' }, TODAY).toString())
			.toBe('ano=2027&estacao=inverno&tipo=especial&ordem=dia&aba=anunciados');
	});
});
