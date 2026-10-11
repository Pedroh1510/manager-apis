import type { ReleaseSummary } from '../services/types';

export type ReleaseSort = 'sonarr' | 'newest';

export const RELEASE_SORTS: ReadonlyArray<{ value: ReleaseSort; label: string }> = [
	{ value: 'sonarr', label: 'Sonarr' },
	{ value: 'newest', label: 'Mais recentes' }
];

/**
 * "Sonarr" keeps the server order (approved first). "Mais recentes" mixes approved and
 * rejected by age (decision S2); sort is stable, so ties keep Sonarr's ranking.
 * @example sortReleases(releases, 'newest')
 */
export function sortReleases(releases: ReleaseSummary[], sort: ReleaseSort): ReleaseSummary[] {
	if (sort === 'sonarr') return releases;
	return [...releases].sort((a, b) => a.ageHours - b.ageHours);
}
