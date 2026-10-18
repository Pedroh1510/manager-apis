export type SeasonName = 'winter' | 'spring' | 'summer' | 'fall'
/** The list types the screen offers; `music` is left out (decision Q4 of anime-season). */
export type AnimeType = 'tv' | 'movie' | 'ova' | 'special' | 'ona'

export const SEASON_NAMES: SeasonName[] = ['winter', 'spring', 'summer', 'fall']
export const ANIME_TYPES: AnimeType[] = ['tv', 'movie', 'ova', 'special', 'ona']

export type SeasonQuery = { kind: 'season'; year: number; season: SeasonName; type: AnimeType } | { kind: 'upcoming'; type: AnimeType }

const HOUR_MS = 60 * 60 * 1000
/** Current, future and upcoming lists still move: scores, members, new entries. */
export const FRESH_TTL_MS = 6 * HOUR_MS
/** A past season barely changes. */
export const PAST_TTL_MS = 7 * 24 * HOUR_MS
export const MAX_ENTRIES = 200

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const MONTHS_PER_SEASON = 3

/**
 * Whether `query` is a season before the one `now` falls in (UTC months: jan–mar winter …).
 * @example isPastSeason({ kind: 'season', year: 2026, season: 'summer', type: 'tv' }, Date.UTC(2026, 9, 18)) // true
 */
export function isPastSeason(query: SeasonQuery, now: number): boolean {
  if (query.kind === 'upcoming') return false
  const date = new Date(now)
  const current = date.getUTCFullYear() * 4 + Math.floor(date.getUTCMonth() / MONTHS_PER_SEASON)
  return query.year * 4 + SEASON_NAMES.indexOf(query.season) < current
}

function cacheKey(query: SeasonQuery): string {
  return query.kind === 'upcoming' ? `upcoming-${query.type}` : `${query.year}-${query.season}-${query.type}`
}

/**
 * In-memory season lists (door 2): only complete lists are kept, equal concurrent requests share
 * one load, and past `MAX_ENTRIES` the least recently used entry goes.
 * @example const list = await cache.get(query, () => gateway.readSeason(2026, 'fall', 'tv'))
 */
export class SeasonCache<T> {
  // Map keeps insertion order; a hit re-inserts, so the first key is the least recently used.
  private readonly entries = new Map<string, CacheEntry<T>>()
  private readonly loading = new Map<string, Promise<T>>()

  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxEntries = MAX_ENTRIES,
  ) {}

  get(query: SeasonQuery, load: () => Promise<T>): Promise<T> {
    const key = cacheKey(query)
    const hit = this.entries.get(key)
    if (hit && this.now() < hit.expiresAt) {
      this.entries.delete(key)
      this.entries.set(key, hit)
      return Promise.resolve(hit.value)
    }
    return this.loading.get(key) ?? this.startLoad(key, query, load)
  }

  private startLoad(key: string, query: SeasonQuery, load: () => Promise<T>): Promise<T> {
    const pending = load()
      .then((value) => {
        this.store(key, value, isPastSeason(query, this.now()) ? PAST_TTL_MS : FRESH_TTL_MS)
        return value
      })
      .finally(() => this.loading.delete(key))
    this.loading.set(key, pending)
    return pending
  }

  private store(key: string, value: T, ttlMs: number): void {
    this.entries.delete(key)
    if (this.entries.size >= this.maxEntries) this.entries.delete(this.entries.keys().next().value as string)
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs })
  }
}
