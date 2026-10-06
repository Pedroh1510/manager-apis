import { useQuery } from '@tanstack/react-query';
import { fetchMangasQueuesSummary, fetchRssQueuesSummary } from '../services/api';
import type { QueuesApi } from '../services/types';

const FETCHERS = { mangas: fetchMangasQueuesSummary, 'anime-rss': fetchRssQueuesSummary } as const;

/**
 * Queue counts of one API. No polling (auto-refresh was deferred): it loads on
 * mount, on window focus, and when the caller refetches.
 * @example const { data, refetch } = useQueuesSummary('mangas')
 */
export function useQueuesSummary(api: QueuesApi) {
	return useQuery({ queryKey: ['queues', api], queryFn: FETCHERS[api], retry: false });
}
