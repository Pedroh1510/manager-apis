import { useQuery } from '@tanstack/react-query';
import { fetchMangasStatus } from '../services/api';

export function useMangasStatus() {
	return useQuery({
		queryKey: ['mangas', 'status'],
		queryFn: fetchMangasStatus,
		refetchInterval: 60_000
	});
}
