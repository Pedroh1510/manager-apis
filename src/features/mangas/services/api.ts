import { mangasHttp } from '../../../lib/http';
import type {
	MangasStatusResponse,
	Plugin,
	MangaListItem,
	MangaFromPlugin,
	AddMangaPayload,
	LinkConnectorPayload,
	UpdateCookiePayload,
	UpdateCredentialsPayload
} from './types';

export async function fetchMangasStatus(): Promise<MangasStatusResponse> {
	const { data } = await mangasHttp.get<MangasStatusResponse>('/status');
	return data;
}

export async function fetchPlugins(): Promise<Plugin[]> {
	const { data } = await mangasHttp.get<Plugin[]>('/mangas/plugins');
	return data;
}

export async function updateCookie(
	payload: UpdateCookiePayload
): Promise<void> {
	await mangasHttp.post('/mangas/adm/cookie', payload);
}

export async function updateCredentials(
	payload: UpdateCredentialsPayload
): Promise<void> {
	await mangasHttp.post('/mangas/adm/credentials', payload);
}

export async function updateMangasByPlugin(idPlugin: string): Promise<void> {
	await mangasHttp.get('/mangas/adm/update-mangas', { params: { idPlugin } });
}

export async function fetchMangaList(): Promise<MangaListItem[]> {
	const { data } = await mangasHttp.get<MangaListItem[]>('/mangas/adm');
	return data;
}

export async function deleteManga(idManga: number): Promise<void> {
	await mangasHttp.delete(`/mangas/adm/${idManga}`);
}

export async function fetchMangasByPlugin(
	idPlugin: string
): Promise<MangaFromPlugin[]> {
	const { data } = await mangasHttp.get<MangaFromPlugin[]>(
		`/mangas/${idPlugin}`
	);
	return data;
}

export async function addManga(
	payload: AddMangaPayload
): Promise<{ idManga: number }> {
	const { data } = await mangasHttp.post<{ idManga: number }>(
		'/mangas/adm',
		payload
	);
	return data;
}

export async function linkConnector(
	idManga: number,
	payload: LinkConnectorPayload
): Promise<void> {
	await mangasHttp.post(`/mangas/adm/${idManga}/connectors`, payload);
}
