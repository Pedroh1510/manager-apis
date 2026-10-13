import { useQuery } from '@tanstack/react-query';
import { fetchTdarrOverview, fetchTdarrStats } from '../services/api';

// react-query pauses refetchInterval while the tab is hidden (decision Q3).
const OVERVIEW_POLL_MS = 5_000;
const STATS_POLL_MS = 60_000;

/**
 * Nodes and active workers, every 5s; `/status` shares the same query key.
 * @example useTdarrOverview(config.data?.tdarr === true)
 */
export function useTdarrOverview(isEnabled = true) {
	return useQuery({ queryKey: ['tdarr', 'overview'], queryFn: fetchTdarrOverview, refetchInterval: OVERVIEW_POLL_MS, enabled: isEnabled });
}

/**
 * Counters and error lists, every 60s: they change slowly and cost Tdarr four calls.
 * @example const stats = useTdarrStats()
 */
export function useTdarrStats() {
	return useQuery({ queryKey: ['tdarr', 'stats'], queryFn: fetchTdarrStats, refetchInterval: STATS_POLL_MS });
}
