export type MangaStatus = 'active' | 'partial' | 'inactive';

// A link is fetching only when it is active and its connector is not turned
// off for every manga (GLOSSARY: Conector desligado); absent means enabled.
const isFetching = (connector: { isActive: boolean; connectorEnabled?: boolean }): boolean =>
	connector.isActive && connector.connectorEnabled !== false;

/**
 * A manga is as active as its connectors: all on, some on, or none (no
 * connector at all counts as inactive — there is nothing that can update it).
 * @example deriveMangaStatus([{ isActive: true }, { isActive: false }]) // 'partial'
 */
export function deriveMangaStatus(connectors: ReadonlyArray<{ isActive: boolean; connectorEnabled?: boolean }>): MangaStatus {
	const activeCount = connectors.filter(isFetching).length;
	if (activeCount === 0) return 'inactive';
	return activeCount === connectors.length ? 'active' : 'partial';
}
