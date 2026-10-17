import type { CoverSuggestion } from '../services/types';

/**
 * Integer percentage of a 0-1 similarity score.
 * @example scorePercent(0.913) // '91%'
 */
export function scorePercent(score: number): string {
	return `${Math.round(score * 100)}%`;
}

/**
 * Suggestions grouped by manga, keeping the API order (strong, then score).
 * @example groupByManga([{ idManga: 1, ... }, { idManga: 1, ... }]) // [[1, [s1, s2]]]
 */
export function groupByManga(suggestions: CoverSuggestion[]): [number, CoverSuggestion[]][] {
	const groups = new Map<number, CoverSuggestion[]>();
	for (const suggestion of suggestions) {
		groups.set(suggestion.idManga, [...(groups.get(suggestion.idManga) ?? []), suggestion]);
	}
	return [...groups.entries()];
}
