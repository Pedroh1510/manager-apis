export interface MangasStatusResponse {
	version: string;
	maxConnections: number;
	openedConnections: number;
}

export interface Plugin {
	id: string;
	name: string;
	[key: string]: unknown;
}

/** One connector link as `GET /mangas/adm` returns it inside each manga. */
export interface MangaConnectorSummary {
	idMangaConnector: number;
	idPlugin: string;
	titlePlugin: string;
	isActive: boolean;
}

export interface MangaListItem {
	idManga: number;
	title: string;
	createdAt: string;
	updatedAt: string;
	connectors: MangaConnectorSummary[];
	altTitles?: string[];
	[key: string]: unknown;
}

export interface MangaFromPlugin {
	id: string;
	title: string;
	[key: string]: unknown;
}

export interface MangaConnector {
	idMangaConnector: number;
	idPlugin: string;
	idMangaPlugin: string;
	titlePlugin: string;
	isActive: boolean;
	[key: string]: unknown;
}

export interface AddMangaPayload {
	title: string;
}

export interface LinkConnectorPayload {
	idPlugin: string;
	idMangaPlugin: string;
	titlePlugin: string;
}

export interface CreateMangaWithConnectorPayload
	extends AddMangaPayload,
		LinkConnectorPayload {}

export interface UpdateCookiePayload {
	idPlugin: string;
	cookie: string;
	userAgent?: string;
}

export interface UpdateCredentialsPayload {
	idPlugin: string;
	login: string;
	password: string;
}

/** A chapter already registered for a manga (`GET /mangas/adm/:idManga/chapters`). */
export interface Chapter {
	idChapter: number;
	idMangaConnector: number;
	idChapterPlugin: string;
	name: string;
	/** NUMERIC column: the API sends it as a string such as "376.0000". */
	volume: string | number;
	downloadedAt: string | null;
}

/** A chapter a connector knows about that is not registered yet (`.../chapters/missing`). */
export interface MissingChapter {
	id: string;
	title?: string;
	volume: string | number;
	idMangaConnector: number;
	[key: string]: unknown;
}

export type CoverSuggestionBand = 'strong' | 'possible';

export interface CoverSuggestion {
	idSuggestion: number;
	idManga: number;
	title: string;
	idPlugin: string;
	idMangaPlugin: string;
	titlePlugin: string;
	score: number;
	band: CoverSuggestionBand;
	titleSimilarity: number;
}

export interface CoverSuggestionConflict extends CoverSuggestion {
	conflictIdManga: number;
	conflictTitle: string;
}

export interface CoverSuggestionsResponse {
	suggestions: CoverSuggestion[];
	conflicts: CoverSuggestionConflict[];
}

/** Response of POST /mangas/adm/kavita/cleanup. */
export interface KavitaCleanupResult {
	totalDeleted: number;
	mangasProcessed: number;
}
