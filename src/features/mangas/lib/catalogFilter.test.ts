import { describe, expect, it } from 'vitest'
import { filterCatalogByTitle, indexCatalogTitles, MAX_VISIBLE_MANGAS } from './catalogFilter'
import type { CatalogEntry } from './catalogLoader'

const plugin = { id: 'nexustoons', name: 'Nexus Toons' }
const entryTitled = (title: string, id = title): CatalogEntry => ({ plugin, manga: { id, title } })
const manyEntries = (count: number) => Array.from({ length: count }, (_, i) => entryTitled(`Manga ${i}`))

describe('filterCatalogByTitle', () => {
  it('matches titles case-insensitively', () => {
    const index = indexCatalogTitles([entryTitled('One Piece'), entryTitled('Naruto')])

    const { visible, total } = filterCatalogByTitle(index, 'PIECE')

    expect(visible.map(({ manga }) => manga.title)).toEqual(['One Piece'])
    expect(total).toBe(1)
  })

  it('keeps every entry when the filter is empty', () => {
    const index = indexCatalogTitles([entryTitled('One Piece'), entryTitled('Naruto')])

    expect(filterCatalogByTitle(index, '').total).toBe(2)
  })

  // Rendering thousands of rows froze typing with "Todos os plugins".
  it('caps the visible rows but reports the full match count', () => {
    const index = indexCatalogTitles(manyEntries(MAX_VISIBLE_MANGAS + 50))

    const { visible, total } = filterCatalogByTitle(index, '')

    expect(visible).toHaveLength(MAX_VISIBLE_MANGAS)
    expect(visible[0].manga.title).toBe('Manga 0')
    expect(total).toBe(MAX_VISIBLE_MANGAS + 50)
  })
})
