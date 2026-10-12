import { useQuery } from '@tanstack/react-query';
import { fetchServerConfig } from '../services/api';

/**
 * Integrations enabled on the server; env only changes on redeploy, so it is read once.
 * @example const isQbittorrentOn = useServerConfig().data?.qbittorrent === true
 */
export function useServerConfig() {
	return useQuery({ queryKey: ['server', 'config'], queryFn: fetchServerConfig, staleTime: Infinity });
}
