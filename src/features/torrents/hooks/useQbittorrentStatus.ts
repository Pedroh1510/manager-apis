import { useQuery } from '@tanstack/react-query';
import { fetchQbittorrentStatus } from '../services/api';

/**
 * Same 60s cadence as the other /status sections; off when the integration is not configured.
 * @example useQbittorrentStatus(config.data?.qbittorrent === true)
 */
export function useQbittorrentStatus(isEnabled: boolean) {
	return useQuery({
		queryKey: ['qbittorrent', 'status'],
		queryFn: fetchQbittorrentStatus,
		refetchInterval: 60_000,
		enabled: isEnabled
	});
}
