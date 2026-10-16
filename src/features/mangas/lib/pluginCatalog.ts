import type { MangaFromPlugin, Plugin } from '../services/types';

/**
 * Display name of a plugin, falling back to its id.
 * @example pluginLabel({ id: 'tcb', name: '' }) // 'tcb'
 */
export const pluginLabel = (plugin: Plugin) => plugin.name || plugin.id;

/**
 * Catalogs can repeat a title; keep the first entry of each.
 * @example dedupeByTitle([{ id: 'a', title: 'X' }, { id: 'b', title: 'X' }]) // [{ id: 'a', title: 'X' }]
 */
export function dedupeByTitle(list: MangaFromPlugin[]): MangaFromPlugin[] {
	const seen = new Set<string>();
	return list.filter((manga) => {
		if (seen.has(manga.title)) return false;
		seen.add(manga.title);
		return true;
	});
}
