import type { CatalogEntry } from './catalogLoader';

/**
 * Rendering every row of "Todos os plugins" (thousands of items, each with a
 * cover) froze typing in the filter, so the list shows only the first matches.
 */
export const MAX_VISIBLE_MANGAS = 100;

/** Catalog entry with its title lowercased once, not on every keystroke. */
export interface IndexedCatalogEntry {
	entry: CatalogEntry;
	normalizedTitle: string;
}

export interface FilteredCatalog {
	visible: CatalogEntry[];
	/** Matches before the cap, so the UI can say how many were left out. */
	total: number;
}

/**
 * Precomputes the lowercased titles used by `filterCatalogByTitle`.
 * @example const index = indexCatalogTitles(catalog.entries);
 */
export const indexCatalogTitles = (entries: CatalogEntry[]): IndexedCatalogEntry[] =>
	entries.map((entry) => ({
		entry,
		normalizedTitle: entry.manga.title.toLowerCase(),
	}));

/**
 * Case-insensitive title match, capped at `MAX_VISIBLE_MANGAS` rows.
 * @example const { visible, total } = filterCatalogByTitle(index, 'piece');
 */
export function filterCatalogByTitle(index: IndexedCatalogEntry[], filter: string): FilteredCatalog {
	const needle = filter.toLowerCase();
	const matches = index.filter(({ normalizedTitle }) => normalizedTitle.includes(needle));
	return {
		visible: matches.slice(0, MAX_VISIBLE_MANGAS).map(({ entry }) => entry),
		total: matches.length,
	};
}
