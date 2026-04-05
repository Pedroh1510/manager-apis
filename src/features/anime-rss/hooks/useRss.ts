import { useQuery } from '@tanstack/react-query';
import { fetchRss } from '../services/api';
import type { FetchRssParams } from '../services/types';

export function useRss(params: FetchRssParams) {
	return useQuery({
		queryKey: ['anime-rss', 'rss', params],
		queryFn: () => fetchRss(params)
	});
}
