import { describe, expect, it } from 'vitest'
import type { MangaFromPlugin } from '../services/types'
import { catalogNotices, loadCatalogs, type FetchCatalog } from './catalogLoader'

const MANGEEK = { id: 'mangeek', name: 'Mangeek' }
const NEXUS = { id: 'nexustoons', name: 'Nexus Toons' }
const TCB = { id: 'tcb', name: '' }

/** Fake catalog source: a list, null (still downloading, 202) or an Error per plugin id. */
class FakeCatalogSource {
  private readonly byPlugin: Record<string, MangaFromPlugin[] | null | Error>

  constructor(byPlugin: Record<string, MangaFromPlugin[] | null | Error>) {
    this.byPlugin = byPlugin
  }

  fetch: FetchCatalog = async (idPlugin) => {
    const result = this.byPlugin[idPlugin]
    if (result instanceof Error) throw result
    return result ?? null
  }
}

describe('loadCatalogs', () => {
  it('merges every plugin catalog sorted by title, tagging each entry with its plugin', async () => {
    const source = new FakeCatalogSource({
      mangeek: [{ id: 'op', title: 'One Piece' }],
      nexustoons: [
        { id: 'n', title: 'Naruto' },
        { id: 'op2', title: 'One Piece' },
      ],
    })

    const result = await loadCatalogs([MANGEEK, NEXUS], source.fetch)

    expect(result.entries.map((e) => [e.plugin.id, e.manga.id])).toEqual([
      ['nexustoons', 'n'],
      ['mangeek', 'op'],
      ['nexustoons', 'op2'],
    ])
    expect(result.pendingPlugins).toEqual([])
    expect(result.failedPlugins).toEqual([])
  })

  it('dedupes repeated titles only within the same plugin', async () => {
    const source = new FakeCatalogSource({
      mangeek: [
        { id: 'a', title: 'X' },
        { id: 'b', title: 'X' },
      ],
      nexustoons: [{ id: 'c', title: 'X' }],
    })

    const result = await loadCatalogs([MANGEEK, NEXUS], source.fetch)

    expect(result.entries.map((e) => e.manga.id)).toEqual(['a', 'c'])
  })

  it('keeps the catalog order when a single plugin is loaded', async () => {
    const source = new FakeCatalogSource({ tcb: [{ id: 'z', title: 'Zeta' }, { id: 'a', title: 'Alpha' }] })

    const result = await loadCatalogs([TCB], source.fetch)

    expect(result.entries.map((e) => e.manga.title)).toEqual(['Zeta', 'Alpha'])
  })

  it('reports still-downloading and failed plugins apart while keeping the loaded ones', async () => {
    const source = new FakeCatalogSource({
      mangeek: null,
      nexustoons: new Error('boom'),
      tcb: [{ id: 'n', title: 'Naruto' }],
    })

    const result = await loadCatalogs([MANGEEK, NEXUS, TCB], source.fetch)

    expect(result.entries.map((e) => e.manga.id)).toEqual(['n'])
    expect(result.pendingPlugins).toEqual([MANGEEK])
    expect(result.failedPlugins).toEqual([NEXUS])
  })
})

describe('catalogNotices', () => {
  const empty = { entries: [], pendingPlugins: [], failedPlugins: [] }

  it('says nothing when every catalog loaded', () => {
    expect(catalogNotices(empty, false)).toEqual([])
  })

  it('keeps the single-plugin downloading message', () => {
    expect(catalogNotices({ ...empty, pendingPlugins: [TCB] }, false)).toEqual([
      'Catálogo deste plugin ainda não foi baixado. O download começou — clique em Próximo novamente em alguns minutos.',
    ])
  })

  it('names pending and failed plugins when searching all of them', () => {
    const result = { ...empty, pendingPlugins: [MANGEEK, TCB], failedPlugins: [NEXUS] }

    expect(catalogNotices(result, true)).toEqual([
      '2 plugins sem catálogo ainda (download iniciado): Mangeek, tcb.',
      'Falha ao carregar: Nexus Toons.',
    ])
  })

  it('uses the singular for one pending plugin', () => {
    expect(catalogNotices({ ...empty, pendingPlugins: [MANGEEK] }, true)).toEqual([
      '1 plugin sem catálogo ainda (download iniciado): Mangeek.',
    ])
  })
})
