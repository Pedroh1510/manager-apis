interface SearchableSeries {
	title: string;
	alternateTitles: string[];
}

/** Lowercase without diacritics, so "acao" finds "Ação". */
function normalize(text: string): string {
	return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * Substring match on the title or any alternate title (romaji names for anime).
 * @example series.filter((s) => matchesSeriesQuery(s, 'shingeki'))
 */
export function matchesSeriesQuery(series: SearchableSeries, query: string): boolean {
	const needle = normalize(query.trim());
	if (!needle) return true;
	return [series.title, ...series.alternateTitles].some((title) => normalize(title).includes(needle));
}
