import { useQuery } from '@tanstack/react-query';
import { fetchAnimeStatus } from '../services/api';

export function useAnimeStatus() {
	return useQuery({
		queryKey: ['anime-rss', 'status'],
		queryFn: fetchAnimeStatus,
		refetchInterval: 60_000
	});
}
