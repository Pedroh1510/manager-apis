export type EpisodeState = 'downloaded' | 'missing' | 'unaired' | 'tba';

/** `GET /api/sonarr/series` item */
export interface SeriesSummary {
	id: number;
	title: string;
	alternateTitles: string[];
	year: number;
	/** `continuing`, `ended`, `upcoming` or whatever Sonarr sends */
	status: string;
	network: string;
	episodeFileCount: number;
	/** monitored episodes that already aired */
	episodeCount: number;
	/** ISO date the series was added to Sonarr; empty when unknown */
	added: string;
}

export interface EpisodeDetail {
	id: number;
	episodeNumber: number;
	title: string;
	airDateUtc: string | null;
	state: EpisodeState;
	monitored: boolean;
}

export interface SeasonDetail {
	seasonNumber: number;
	/** Sonarr's season flag: whether future episodes of it get monitored */
	monitored: boolean;
	episodeFileCount: number;
	episodeCount: number;
	episodes: EpisodeDetail[];
}

/** `GET /api/sonarr/series/:id` */
export interface SeriesDetail extends Omit<SeriesSummary, 'alternateTitles' | 'added'> {
	overview: string;
	sizeOnDisk: number;
	seasons: SeasonDetail[];
}

/** `GET /api/sonarr/status` */
export interface SonarrStatus {
	version: string;
	health: { type: string; message: string }[];
	queueCount: number;
	rootFolders: { path: string; freeSpace: number }[];
}

/** `GET /api/sonarr/releases` item; approved ones come first. */
export interface ReleaseSummary {
	guid: string;
	indexerId: number;
	title: string;
	indexer: string;
	quality: string;
	size: number;
	seeders: number | null;
	leechers: number | null;
	ageHours: number;
	approved: boolean;
	rejections: string[];
}

/** One episode, or one season of a series. */
export type ReleaseQuery = { episodeId: number } | { seriesId: number; seasonNumber: number };

/** `GET /api/sonarr/lookup` item; `seriesId` is set when the series is already in the library */
export interface SeriesLookupResult {
	tvdbId: number;
	title: string;
	year: number;
	network: string | null;
	overview: string | null;
	genres: string[];
	remotePoster: string | null;
	seriesId: number | null;
}

export type SeriesType = 'standard' | 'anime' | 'daily';

export type MonitorOption = 'all' | 'future' | 'none' | 'firstSeason' | 'lastSeason';

/** `GET /api/sonarr/add-options` */
export interface AddOptions {
	qualityProfiles: { id: number; name: string }[];
	rootFolders: { path: string; freeSpace: number }[];
}

/** `POST /api/sonarr/series` body */
export interface AddSeriesInput {
	tvdbId: number;
	qualityProfileId: number;
	rootFolderPath: string;
	seriesType: SeriesType;
	monitor: MonitorOption;
	searchForMissingEpisodes: boolean;
}

export interface MissingEpisode {
	episodeId: number;
	seriesId: number;
	seriesTitle: string;
	seasonNumber: number;
	episodeNumber: number;
	title: string;
	airDateUtc: string | null;
}

/** `GET /api/sonarr/missing` */
export interface MissingPage {
	page: number;
	pageSize: number;
	totalRecords: number;
	records: MissingEpisode[];
}
