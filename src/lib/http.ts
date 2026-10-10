import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

/**
 * Every API here answers JSON. An HTML 200 means the request fell through to an SPA fallback
 * (e.g. VITE_RSS_API_URL unset), so it becomes an error instead of a string that crashes a
 * component expecting an array.
 */
function rejectHtmlResponse(response: AxiosResponse): AxiosResponse {
	const contentType = String(response.headers['content-type'] ?? '');
	if (!contentType.includes('text/html')) return response;
	const url = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
	throw new Error(`resposta HTML em vez de JSON em ${url}: confira a URL da API no .env`);
}

function createJsonClient(baseURL: string | undefined): AxiosInstance {
	const client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
	client.interceptors.response.use(rejectHtmlResponse);
	return client;
}

export const rssHttp = createJsonClient(import.meta.env.VITE_RSS_API_URL);

export const mangasHttp = createJsonClient(import.meta.env.VITE_MANGAS_API_URL);

/** The Express server in server/, same origin as the SPA (Vite proxies /api in dev). */
export const serverHttp = createJsonClient('/api');
