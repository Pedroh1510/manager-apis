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

/** One alternate name across its seasons; `seasonNumbers: []` means the whole series. */
export interface AlternateTitle {
	title: string;
	seasonNumbers: number[];
}

/** `GET /api/sonarr/series/:id` */
export interface SeriesDetail extends Omit<SeriesSummary, 'alternateTitles' | 'added'> {
	alternateTitles: AlternateTitle[];
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

/** `GET /api/sonarr/import/queue` item: a download Sonarr holds for a manual import */
export interface StuckDownload {
	downloadId: string;
	title: string;
	seriesTitle: string | null;
	state: string;
	messages: string[];
	size: number;
}

export interface EpisodeRef {
	id: number;
	seasonNumber: number;
	episodeNumber: number;
}

/** `GET /api/sonarr/import/files` item */
export interface ImportCandidate {
	path: string;
	relativePath: string;
	size: number;
	seriesId: number | null;
	seriesTitle: string | null;
	episodes: EpisodeRef[];
	quality: string;
	languages: string[];
	releaseGroup: string | null;
	rejections: string[];
}

/** One file of `POST /api/sonarr/import` */
export interface ImportChoice {
	path: string;
	seriesId: number;
	episodeIds: number[];
}

/** `GET /api/sonarr/commands/:id` */
export interface CommandStatus {
	state: 'pending' | 'completed' | 'failed';
	message: string | null;
}

/** Where a manual import reads its files: a stuck download, or the upload folder (optionally parsed against one series). */
export type ImportFileSource = { downloadId: string } | { source: 'upload'; seriesId?: number };

/** `GET /api/sonarr/uploads` item */
export interface UploadedFile {
	name: string;
	size: number;
	modifiedAt: string;
}

export type CalendarStatus = 'downloaded' | 'missing' | 'unaired' | 'unmonitored';

/** `GET /api/sonarr/calendar` item; always has an air date. */
export interface CalendarItem {
	episodeId: number;
	seriesId: number;
	seriesTitle: string;
	seasonNumber: number;
	episodeNumber: number;
	title: string;
	airDateUtc: string;
	status: CalendarStatus;
}

export interface CalendarQuery {
	start: string;
	end: string;
	unmonitored: boolean;
}
