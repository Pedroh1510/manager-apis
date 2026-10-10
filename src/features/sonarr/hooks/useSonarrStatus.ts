import { useQuery } from '@tanstack/react-query';
import { fetchSonarrStatus } from '../services/api';

/**
 * Same 60s cadence as the other /status sections; off when Sonarr is not configured.
 * @example useSonarrStatus(config.data?.sonarr === true)
 */
export function useSonarrStatus(isEnabled: boolean) {
	return useQuery({ queryKey: ['sonarr', 'status'], queryFn: fetchSonarrStatus, refetchInterval: 60_000, enabled: isEnabled });
}
