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

export interface MangaListItem {
	idManga: number;
	title: string;
	createdAt: string;
	updatedAt: string;
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
