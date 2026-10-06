export type MangaStatus = 'active' | 'partial' | 'inactive';

/**
 * A manga is as active as its connectors: all on, some on, or none (no
 * connector at all counts as inactive — there is nothing that can update it).
 * @example deriveMangaStatus([{ isActive: true }, { isActive: false }]) // 'partial'
 */
export function deriveMangaStatus(connectors: ReadonlyArray<{ isActive: boolean }>): MangaStatus {
	const activeCount = connectors.filter((connector) => connector.isActive).length;
	if (activeCount === 0) return 'inactive';
	return activeCount === connectors.length ? 'active' : 'partial';
}
