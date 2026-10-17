const MANGAS_API_URL = import.meta.env.VITE_MANGAS_API_URL;

/**
 * Fixed cover of a registered manga, served by the mangas API.
 * @example mangaCoverUrl(7) // 'https://…/mangas/adm/7/cover'
 */
export function mangaCoverUrl(idManga: number): string {
	return `${MANGAS_API_URL}/mangas/adm/${idManga}/cover`;
}

/**
 * Cover of a plugin catalog item; the API looks the source up by these keys.
 * @example catalogCoverUrl('nexustoons', 'pico-marcial') // 'https://…/mangas/nexustoons/cover/pico-marcial'
 */
export function catalogCoverUrl(pluginId: string, idMangaPlugin: string): string {
	return `${MANGAS_API_URL}/mangas/${encodeURIComponent(pluginId)}/cover/${encodeURIComponent(idMangaPlugin)}`;
}
