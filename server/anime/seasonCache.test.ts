// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { SeasonCache, type SeasonQuery } from './seasonCache.js'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
// 2026-10-18: the current season is fall 2026.
const NOW = Date.UTC(2026, 9, 18, 12)

const season = (year: number, name: 'winter' | 'spring' | 'summer' | 'fall', type = 'tv' as const): SeasonQuery => ({ kind: 'season', year, season: name, type })
const UPCOMING: SeasonQuery = { kind: 'upcoming', type: 'tv' }

/** Counts loads and resolves each one with its own number. */
class CountingLoader {
  calls = 0
  load = async () => ++this.calls
}

function cacheAt(start: number) {
  const clock = { now: start }
  const cache = new SeasonCache<number>(() => clock.now)
  return { cache, clock }
}

describe('SeasonCache', () => {
  it('ttl is 6 hours for current, future and upcoming', async () => {
    for (const query of [season(2026, 'fall'), season(2027, 'winter'), UPCOMING]) {
      const { cache, clock } = cacheAt(NOW)
      const loader = new CountingLoader()
      await cache.get(query, loader.load)
      clock.now = NOW + 6 * HOUR - 1
      await cache.get(query, loader.load)
      expect(loader.calls).toBe(1)
      clock.now = NOW + 6 * HOUR
      await cache.get(query, loader.load)
      expect(loader.calls).toBe(2)
    }
  })

  it('ttl is 7 days for past seasons', async () => {
    const { cache, clock } = cacheAt(NOW)
    const loader = new CountingLoader()
    await cache.get(season(2026, 'summer'), loader.load)
    clock.now = NOW + 7 * DAY - 1
    await cache.get(season(2026, 'summer'), loader.load)
    expect(loader.calls).toBe(1)
    clock.now = NOW + 7 * DAY
    await cache.get(season(2026, 'summer'), loader.load)
    expect(loader.calls).toBe(2)
  })

  it('types of the same season are separate entries', async () => {
    const { cache } = cacheAt(NOW)
    const loader = new CountingLoader()
    await cache.get(season(2026, 'fall', 'tv'), loader.load)
    await cache.get({ kind: 'season', year: 2026, season: 'fall', type: 'ona' }, loader.load)
    expect(loader.calls).toBe(2)
  })

  it('concurrent requests share one load', async () => {
    const { cache } = cacheAt(NOW)
    let release: (value: number) => void = () => undefined
    let calls = 0
    const slowLoad = () => {
      calls++
      return new Promise<number>((resolve) => { release = resolve })
    }
    const first = cache.get(UPCOMING, slowLoad)
    const second = cache.get(UPCOMING, slowLoad)
    release(42)
    expect(await Promise.all([first, second])).toEqual([42, 42])
    expect(calls).toBe(1)

    const failing = () => {
      calls++
      return Promise.reject(new Error('boom'))
    }
    const results = await Promise.allSettled([cache.get(season(2025, 'fall'), failing), cache.get(season(2025, 'fall'), failing)])
    expect(results.map(({ status }) => status)).toEqual(['rejected', 'rejected'])
    expect(calls).toBe(2)
    await cache.get(season(2025, 'fall'), async () => ++calls)
    expect(calls).toBe(3)
  })

  it('evicts the least recently used at 200 entries', async () => {
    const { cache } = cacheAt(NOW)
    const loader = new CountingLoader()
    for (let year = 1900; year < 2100; year++) await cache.get(season(year, 'spring'), loader.load)
    expect(loader.calls).toBe(200)

    await cache.get(season(1900, 'spring'), loader.load)
    await cache.get(season(2100, 'spring'), loader.load)
    expect(loader.calls).toBe(201)

    await cache.get(season(1900, 'spring'), loader.load)
    expect(loader.calls).toBe(201)
    await cache.get(season(1901, 'spring'), loader.load)
    expect(loader.calls).toBe(202)
  })
})
