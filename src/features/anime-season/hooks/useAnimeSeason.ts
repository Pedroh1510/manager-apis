import { useQuery } from '@tanstack/react-query';
import type { SeasonParams } from '../lib/seasonParams';
import { fetchAnimeSeason, fetchUpcomingAnime } from '../services/api';

// The server caches for hours; re-asking within a visit only costs a round trip.
const SEASON_STALE_MS = 5 * 60 * 1000;

/**
 * The whole season (or upcoming) list for the chosen type; sorting and filtering happen on the client.
 * @example const list = useAnimeSeason(params)
 */
export function useAnimeSeason({ tab, year, season, type }: SeasonParams) {
	const isUpcoming = tab === 'upcoming';
	return useQuery({
		queryKey: isUpcoming ? ['anime', 'upcoming', type] : ['anime', 'season', year, season, type],
		queryFn: () => (isUpcoming ? fetchUpcomingAnime(type) : fetchAnimeSeason(year, season, type)),
		staleTime: SEASON_STALE_MS
	});
}
