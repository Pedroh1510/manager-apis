import type { MangaFromPlugin, Plugin } from '../services/types';
import { dedupeByTitle, pluginLabel } from './pluginCatalog';

/** One catalog row, tagged with the plugin it came from. */
export interface CatalogEntry {
	plugin: Plugin;
	manga: MangaFromPlugin;
}

export interface LoadedCatalogs {
	entries: CatalogEntry[];
	/** Catalog not cached yet: the API answered 202 and queued its download. */
	pendingPlugins: Plugin[];
	failedPlugins: Plugin[];
}

/** Resolves to null while the plugin catalog is still downloading (202). */
export type FetchCatalog = (idPlugin: string) => Promise<MangaFromPlugin[] | null>;

const SINGLE_PLUGIN_DOWNLOADING_MESSAGE =
	'Catálogo deste plugin ainda não foi baixado. O download começou — clique em Próximo novamente em alguns minutos.';

const byTitle = (a: CatalogEntry, b: CatalogEntry) =>
	a.manga.title.localeCompare(b.manga.title, 'pt-BR', { sensitivity: 'base' });

const listLabels = (plugins: Plugin[]) => plugins.map(pluginLabel).join(', ');

/**
 * Fetches the catalogs in parallel; a plugin still downloading or failing is
 * reported apart so the others stay usable. Several plugins sort by title, so
 * the same manga from different plugins sits side by side.
 * @example const { entries, pendingPlugins } = await loadCatalogs(plugins, fetchMangasByPlugin);
 */
export async function loadCatalogs(plugins: Plugin[], fetchCatalog: FetchCatalog): Promise<LoadedCatalogs> {
	const results = await Promise.allSettled(plugins.map((plugin) => fetchCatalog(plugin.id)));
	const loaded: LoadedCatalogs = { entries: [], pendingPlugins: [], failedPlugins: [] };
	results.forEach((result, index) => {
		const plugin = plugins[index];
		if (result.status === 'rejected') return loaded.failedPlugins.push(plugin);
		if (result.value === null) return loaded.pendingPlugins.push(plugin);
		loaded.entries.push(...dedupeByTitle(result.value).map((manga) => ({ plugin, manga })));
	});
	return plugins.length > 1 ? { ...loaded, entries: [...loaded.entries].sort(byTitle) } : loaded;
}

function pendingNotice(pending: Plugin[], isAllPlugins: boolean): string {
	if (!isAllPlugins) return SINGLE_PLUGIN_DOWNLOADING_MESSAGE;
	const noun = pending.length === 1 ? 'plugin' : 'plugins';
	return `${pending.length} ${noun} sem catálogo ainda (download iniciado): ${listLabels(pending)}.`;
}

/**
 * Warnings for the plugins left out of a load.
 * @example catalogNotices(result, true) // ['1 plugin sem catálogo ainda (download iniciado): Mangeek.']
 */
export function catalogNotices({ pendingPlugins, failedPlugins }: LoadedCatalogs, isAllPlugins: boolean): string[] {
	const notices: string[] = [];
	if (pendingPlugins.length > 0) notices.push(pendingNotice(pendingPlugins, isAllPlugins));
	if (failedPlugins.length > 0) notices.push(`Falha ao carregar: ${listLabels(failedPlugins)}.`);
	return notices;
}
