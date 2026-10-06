import type { MangaConnectorSummary, MangaListItem } from '../services/types'

let nextConnectorId = 100

export function connector(idPlugin: string, isActive: boolean, titlePlugin = idPlugin): MangaConnectorSummary {
  nextConnectorId += 1
  return { idMangaConnector: nextConnectorId, idPlugin, titlePlugin, isActive }
}

export function manga(idManga: number, title: string, connectors: MangaConnectorSummary[]): MangaListItem {
  return { idManga, title, createdAt: '2026-01-01', updatedAt: '2026-01-01', connectors }
}

export const PLUGINS = [
  { id: 'tcb', name: 'TCB' },
  { id: 'mangeek', name: 'Mangeek' },
]

export const PLUGIN_NAMES: Record<string, string> = { tcb: 'TCB', mangeek: 'Mangeek' }
