export interface TorrentCounts {
	downloading: number;
	completed: number;
	queued: number;
	stopped: number;
}

export interface ActiveTorrent {
	hash: string;
	name: string;
	/** 0..1 */
	progress: number;
	/** bytes/s */
	downloadSpeed: number;
	etaSeconds: number | null;
	category: string;
}

/** `GET /api/qbittorrent/torrents` */
export interface TorrentsSummary {
	counts: TorrentCounts;
	overallEtaSeconds: number | null;
	etaUnknownCount: number;
	active: ActiveTorrent[];
}

/** `GET /api/qbittorrent/status` */
export interface QbittorrentStatus {
	version: string;
	apiVersion: string;
	downloading: number;
	completed: number;
	/** bytes/s */
	downloadSpeed: number;
	/** bytes/s */
	uploadSpeed: number;
}
