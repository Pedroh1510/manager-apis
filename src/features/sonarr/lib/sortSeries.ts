import type { SeriesSummary } from '../services/types';

export type SeriesSort = 'title' | 'year' | 'missing' | 'added';

export const SERIES_SORTS: ReadonlyArray<{ value: SeriesSort; label: string }> = [
	{ value: 'title', label: 'Título' },
	{ value: 'year', label: 'Ano' },
	{ value: 'missing', label: 'Mais faltando' },
	{ value: 'added', label: 'Adicionadas recentemente' }
];

const missingOf = (series: SeriesSummary) => series.episodeCount - series.episodeFileCount;

// Descending keys: newest year, most missing, latest added. ISO dates compare as strings.
const COMPARE: Record<Exclude<SeriesSort, 'title'>, (a: SeriesSummary, b: SeriesSummary) => number> = {
	year: (a, b) => b.year - a.year,
	missing: (a, b) => missingOf(b) - missingOf(a),
	added: (a, b) => b.added.localeCompare(a.added)
};

/**
 * The server already sends title order; Array.prototype.sort is stable, so ties keep it.
 * @example sortSeries(series, 'missing')
 */
export function sortSeries(series: SeriesSummary[], sort: SeriesSort): SeriesSummary[] {
	if (sort === 'title') return series;
	return [...series].sort(COMPARE[sort]);
}

/** @example isSeriesSort(params.get('sort')) */
export function isSeriesSort(value: string | null): value is SeriesSort {
	return SERIES_SORTS.some((sort) => sort.value === value);
}
