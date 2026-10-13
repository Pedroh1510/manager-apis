import { serverHttp } from '../../../lib/http';
import type { TdarrOverview, TdarrStats } from './types';

export async function fetchTdarrOverview(): Promise<TdarrOverview> {
	const { data } = await serverHttp.get<TdarrOverview>('/tdarr/overview');
	return data;
}

export async function fetchTdarrStats(): Promise<TdarrStats> {
	const { data } = await serverHttp.get<TdarrStats>('/tdarr/stats');
	return data;
}
