export interface AnimeStatusDatabase {
	version: string;
	maxConnections: number;
	activeConnections: number;
	error?: string;
}

export interface AnimeStatusQbittorrent {
	version: string;
	apiVersion: string;
	error?: string;
}

export interface AnimeStatusResponse {
	database: AnimeStatusDatabase | { error: string };
	qbittorrent: AnimeStatusQbittorrent | { error: string };
}

export interface RssItem {
	title: string;
	link?: string;
	pubDate?: string;
	[key: string]: unknown;
}

export interface Torrent {
	hash: string;
	name: string;
	state: string;
	progress: number;
	size: number;
	dlspeed: number;
}

export interface FetchRssParams {
	scanAllItems?: boolean;
	q?: string;
	term?: string;
	isScan?: boolean;
}
