import { useQuery } from '@tanstack/react-query';
import { fetchSeriesDetail, fetchSeriesList } from '../services/api';

/**
 * Library list; no polling, refetched on mount and window focus (decision R6).
 * @example const { data } = useSeriesList()
 */
export function useSeriesList() {
	return useQuery({ queryKey: ['sonarr', 'series'], queryFn: fetchSeriesList });
}

/**
 * @example const { data } = useSeriesDetail(1)
 */
export function useSeriesDetail(seriesId: number) {
	return useQuery({ queryKey: ['sonarr', 'series', seriesId], queryFn: () => fetchSeriesDetail(seriesId) });
}
