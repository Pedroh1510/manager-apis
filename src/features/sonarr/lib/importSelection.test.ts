import { describe, expect, it } from 'vitest'
import type { ImportCandidate } from '../services/types'
import { canImport, formatEpisodeList, initialSelection, toImportChoices } from './importSelection'

const candidate = (path: string, seriesId: number | null, episodeIds: number[]): ImportCandidate => ({
  path, relativePath: path, size: 1, seriesId, seriesTitle: null, quality: '', languages: [], releaseGroup: null, rejections: [],
  episodes: episodeIds.map((id) => ({ id, seasonNumber: 2, episodeNumber: id - 100 })),
})

describe('import selection', () => {
  it('pre-checks only files with series and episodes', () => {
    const selection = initialSelection([candidate('a', 2, [103]), candidate('b', null, []), candidate('c', 2, [])])
    expect([selection.a.isChecked, selection.b.isChecked, selection.c.isChecked]).toEqual([true, false, false])
  })

  it('fills unrecognized files with the default series', () => {
    const selection = initialSelection([candidate('a', 2, [103]), candidate('b', null, [])], 5)
    expect([selection.a.seriesId, selection.b.seriesId, selection.b.episodes]).toEqual([2, 5, []])
  })

  it('can import only when every checked file has series and episodes', () => {
    const ready = { isChecked: true, seriesId: 2, episodes: [{ id: 103, seasonNumber: 2, episodeNumber: 3 }] }
    expect(canImport({})).toBe(false)
    expect(canImport({ a: { ...ready, isChecked: false } })).toBe(false)
    expect(canImport({ a: ready, b: { isChecked: true, seriesId: null, episodes: ready.episodes } })).toBe(false)
    expect(canImport({ a: ready, b: { isChecked: true, seriesId: 2, episodes: [] } })).toBe(false)
    expect(canImport({ a: ready, b: { ...ready, isChecked: false, seriesId: null } })).toBe(true)
  })

  it('sends only the checked files with their episode ids', () => {
    const selection = initialSelection([candidate('a', 2, [107, 108]), candidate('b', null, [])])
    expect(toImportChoices(selection)).toEqual([{ path: 'a', seriesId: 2, episodeIds: [107, 108] }])
  })

  it('lists episode codes or Nenhum', () => {
    expect(formatEpisodeList([])).toBe('Nenhum')
    expect(formatEpisodeList([{ id: 1, seasonNumber: 2, episodeNumber: 7 }, { id: 2, seasonNumber: 2, episodeNumber: 8 }])).toBe('S02E07, S02E08')
  })
})
