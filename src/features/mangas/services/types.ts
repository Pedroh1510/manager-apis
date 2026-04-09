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
	title: string;
	titleInPlugin: string;
	idPlugin: string;
	[key: string]: unknown;
}

export interface MangaFromPlugin {
	title: string;
	link?: string;
	[key: string]: unknown;
}

export interface AddMangaPayload {
	title: string;
	titleInPlugin: string;
	idPlugin: string;
}

export interface UpdateCookiePayload {
	idPlugin: string;
	cookie: string;
	userAgent?: string;
}

export interface UpdateCredentialsPayload {
	idPlugin: string;
	userAgent?: string;
	credentials: Record<string, unknown>;
}
