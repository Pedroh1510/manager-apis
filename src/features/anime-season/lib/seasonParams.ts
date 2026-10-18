import type { AnimeType, SeasonName } from '../services/types';
import { MIN_SEASON_YEAR, currentSeason, maxSeasonYear } from './seasons';

export type SeasonSort = 'popularity' | 'score' | 'weekday';
export type SeasonTab = 'season' | 'upcoming';

export interface SeasonParams {
	year: number;
	season: SeasonName;
	type: AnimeType;
	sort: SeasonSort;
	tab: SeasonTab;
}

// URL words are Portuguese, like `?semana=` in the calendar (door 5).
const SEASON_WORDS: Record<string, SeasonName> = { inverno: 'winter', primavera: 'spring', verao: 'summer', outono: 'fall' };
const TYPE_WORDS: Record<string, AnimeType> = { tv: 'tv', ona: 'ona', filme: 'movie', ova: 'ova', especial: 'special' };
const SORT_WORDS: Record<string, SeasonSort> = { popularidade: 'popularity', score: 'score', dia: 'weekday' };
const UPCOMING_WORD = 'anunciados';

const wordFor = <T extends string>(words: Record<string, T>, value: T) => Object.keys(words).find((word) => words[word] === value) as string;

function parseYear(raw: string | null, today: Date): number {
	const year = Number(raw);
	const isValid = raw !== null && /^\d+$/.test(raw) && year >= MIN_SEASON_YEAR && year <= maxSeasonYear(today);
	return isValid ? year : currentSeason(today).year;
}

/**
 * Reads `?ano=&estacao=&tipo=&ordem=&aba=`; each missing or invalid value falls back to its default.
 * @example parseSeasonParams(new URLSearchParams('tipo=filme'), new Date()).type // 'movie'
 */
export function parseSeasonParams(search: URLSearchParams, today: Date): SeasonParams {
	return {
		year: parseYear(search.get('ano'), today),
		season: SEASON_WORDS[search.get('estacao') ?? ''] ?? currentSeason(today).season,
		type: TYPE_WORDS[search.get('tipo') ?? ''] ?? 'tv',
		sort: SORT_WORDS[search.get('ordem') ?? ''] ?? 'popularity',
		tab: search.get('aba') === UPCOMING_WORD ? 'upcoming' : 'season'
	};
}

/**
 * The URL for `params`, leaving out every default (current season, `tv`, popularity, season tab).
 * @example seasonParamsToSearch({ ...params, type: 'movie' }, today).toString() // 'tipo=filme'
 */
export function seasonParamsToSearch(params: SeasonParams, today: Date): URLSearchParams {
	const current = currentSeason(today);
	const search = new URLSearchParams();
	const isCurrent = params.year === current.year && params.season === current.season;
	if (!isCurrent) search.set('ano', String(params.year));
	if (!isCurrent) search.set('estacao', wordFor(SEASON_WORDS, params.season));
	if (params.type !== 'tv') search.set('tipo', wordFor(TYPE_WORDS, params.type));
	if (params.sort !== 'popularity') search.set('ordem', wordFor(SORT_WORDS, params.sort));
	if (params.tab === 'upcoming') search.set('aba', UPCOMING_WORD);
	return search;
}
