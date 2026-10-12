import { serverHttp } from '../../../lib/http';

/** Which server integrations have their env set; a disabled one answers 503. */
export interface ServerConfig {
	qbittorrent: boolean;
}

export async function fetchServerConfig(): Promise<ServerConfig> {
	const { data } = await serverHttp.get<ServerConfig>('/config');
	return data;
}
