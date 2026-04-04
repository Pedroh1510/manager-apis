import { rssHttp } from '../../../lib/http';
import type {
	AnimeStatusResponse,
	RssItem,
	Torrent,
	FetchRssParams
} from './types';

export async function fetchAnimeStatus(): Promise<AnimeStatusResponse> {
	const { data } = await rssHttp.get<AnimeStatusResponse>('/status');
	return data;
}

export async function fetchRss(params: FetchRssParams): Promise<RssItem[]> {
	const { data } = await rssHttp.get<RssItem[]>('/rss/json', { params });
	return data;
}

export async function fetchTorrents(): Promise<Torrent[]> {
	const { data } = await rssHttp.get<Torrent[]>('/adm/torrents');
	return data;
}

export async function fetchConcludedTorrents(): Promise<Torrent[]> {
	const { data } = await rssHttp.get<Torrent[]>('/adm/torrents/concluded');
	return data;
}

export async function stopTorrent(hash: string): Promise<void> {
	await rssHttp.patch(`/adm/torrents/${hash}/stop`);
}

export async function deleteTorrent(hash: string): Promise<void> {
	await rssHttp.delete(`/adm/torrents/${hash}`);
}

export async function deleteAllTorrents(): Promise<void> {
	await rssHttp.get('/adm/delete');
}
