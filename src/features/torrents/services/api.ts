import { serverHttp } from '../../../lib/http';
import type { QbittorrentStatus, TorrentsSummary } from './types';

export async function fetchTorrents(): Promise<TorrentsSummary> {
	const { data } = await serverHttp.get<TorrentsSummary>('/qbittorrent/torrents');
	return data;
}

export async function fetchQbittorrentStatus(): Promise<QbittorrentStatus> {
	const { data } = await serverHttp.get<QbittorrentStatus>('/qbittorrent/status');
	return data;
}
