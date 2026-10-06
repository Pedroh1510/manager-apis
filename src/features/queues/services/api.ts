import { mangasHttp, rssHttp } from '../../../lib/http';
import type { QueueSummary } from './types';

export async function fetchMangasQueuesSummary(): Promise<QueueSummary[]> {
	const { data } = await mangasHttp.get<QueueSummary[]>('/queues-summary');
	return data;
}

export async function fetchRssQueuesSummary(): Promise<QueueSummary[]> {
	const { data } = await rssHttp.get<QueueSummary[]>('/queues-summary');
	return data;
}
