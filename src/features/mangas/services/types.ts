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
