import { describe, expect, it } from 'vitest'
import { MemoryPrefsStorage } from '../../../test/MemoryPrefsStorage'
import type { AddOptions } from '../services/types'
import { ADD_SERIES_PREFS_KEY, readAddSeriesPrefs, resolveAddSeriesDefaults, writeAddSeriesPrefs, type AddSeriesPrefs } from './addSeriesPrefs'

const saved: AddSeriesPrefs = { qualityProfileId: 4, rootFolderPath: '/anime', monitor: 'lastSeason', searchForMissingEpisodes: false }
const options: AddOptions = {
  qualityProfiles: [{ id: 1, name: 'Any' }, { id: 4, name: 'HD-1080p' }],
  rootFolders: [{ path: '/tv', freeSpace: 1 }, { path: '/anime', freeSpace: 1 }],
}

describe('add series prefs', () => {
  it('reads nothing from empty, broken or throwing storage', () => {
    expect(readAddSeriesPrefs(new MemoryPrefsStorage())).toBeNull()
    expect(readAddSeriesPrefs(new MemoryPrefsStorage({ [ADD_SERIES_PREFS_KEY]: '{oops' }))).toBeNull()
    expect(readAddSeriesPrefs(new MemoryPrefsStorage({ [ADD_SERIES_PREFS_KEY]: '{"monitor":"pilot"}' }))).toBeNull()
    expect(readAddSeriesPrefs(new MemoryPrefsStorage({}, true))).toBeNull()
    expect(readAddSeriesPrefs(null)).toBeNull()
  })

  it('writes what it reads back, and ignores a throwing storage', () => {
    const storage = new MemoryPrefsStorage()
    writeAddSeriesPrefs(storage, saved)
    expect(readAddSeriesPrefs(storage)).toEqual(saved)
    expect(() => writeAddSeriesPrefs(new MemoryPrefsStorage({}, true), saved)).not.toThrow()
  })

  it('keeps saved values that still exist and falls back to the first option', () => {
    expect(resolveAddSeriesDefaults(saved, options)).toEqual(saved)
    expect(resolveAddSeriesDefaults({ ...saved, qualityProfileId: 9, rootFolderPath: '/x' }, options)).toEqual({
      ...saved, qualityProfileId: 1, rootFolderPath: '/tv',
    })
    expect(resolveAddSeriesDefaults(null, options)).toEqual({
      qualityProfileId: 1, rootFolderPath: '/tv', monitor: 'all', searchForMissingEpisodes: true,
    })
  })
})
