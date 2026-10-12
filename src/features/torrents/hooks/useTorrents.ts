import { useQuery } from '@tanstack/react-query';
import { fetchTorrents } from '../services/api';

export const TORRENTS_REFRESH_MS = 5000;

/**
 * Polls while the screen is mounted; TanStack Query pauses it while the tab is hidden.
 * @example const { data } = useTorrents()
 */
export function useTorrents() {
	return useQuery({ queryKey: ['qbittorrent', 'torrents'], queryFn: fetchTorrents, refetchInterval: TORRENTS_REFRESH_MS });
}
