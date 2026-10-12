import { serverHttp } from '../../../lib/http';

/** Which server integrations have their env set; a disabled one answers 503. */
export interface ServerConfig {
	qbittorrent: boolean;
	sonarr: boolean;
	/** SONARR_UPLOAD_DIR is set: the upload sections and shortcut show. */
	sonarrUpload: boolean;
	/** TDARR_URL is set: the Tdarr page and its /status section show. */
	tdarr: boolean;
}

export async function fetchServerConfig(): Promise<ServerConfig> {
	const { data } = await serverHttp.get<ServerConfig>('/config');
	return data;
}
