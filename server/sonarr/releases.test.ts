// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { orderReleases, toReleaseSummary, type ReleaseSummary } from './releases.js'

const release = (guid: string, approved: boolean): ReleaseSummary => ({
  guid, indexerId: 1, title: guid, indexer: 'x', quality: 'q', size: 1, seeders: null, leechers: null, ageHours: 1, approved, rejections: [],
})

describe('releases', () => {
  it('puts approved releases first keeping sonarr order', () => {
    const ordered = orderReleases([release('r1', false), release('r2', true), release('r3', false), release('r4', true)])
    expect(ordered.map((r) => r.guid)).toEqual(['r2', 'r4', 'r1', 'r3'])
  })

  it('accepts rejections as strings or reason objects', () => {
    const base = { guid: 'g', indexerId: 1, title: 't', indexer: 'i', size: 1, ageHours: 1, approved: false }
    expect(toReleaseSummary({ ...base, rejections: ['Quality not wanted'] }).rejections).toEqual(['Quality not wanted'])
    expect(toReleaseSummary({ ...base, rejections: [{ reason: 'Too big' }] }).rejections).toEqual(['Too big'])
  })
})
