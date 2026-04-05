export interface AnimeStatusResponse {
	status: string;
	[key: string]: unknown;
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
