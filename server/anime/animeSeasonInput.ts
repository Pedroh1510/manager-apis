import { ANIME_TYPES, SEASON_NAMES, type AnimeType, type SeasonQuery } from './seasonCache.js'

/** A request the route rejects with 400 before calling the upstream. */
export class SeasonInputError extends Error {}

/** The oldest season the screen offers. */
export const MIN_SEASON_YEAR = 1917

const received = (raw: unknown) => `"${typeof raw === 'string' ? raw : String(raw)}"`

/**
 * `?type=`: one of the five accepted list types, `tv` when absent.
 * @example parseAnimeType(undefined) // 'tv'
 */
export function parseAnimeType(raw: unknown): AnimeType {
  if (raw === undefined) return 'tv'
  const type = ANIME_TYPES.find((accepted) => accepted === raw)
  if (type) return type
  throw new SeasonInputError(`type inválido: ${received(raw)}, esperado ${ANIME_TYPES.join('|')}`)
}

/**
 * `/seasons/:year/:season?type=`, with the year between 1917 and next year (by the server clock).
 * @example parseSeasonQuery({ year: '2026', season: 'fall' }, {}, new Date()) // { kind: 'season', year: 2026, season: 'fall', type: 'tv' }
 */
export function parseSeasonQuery(params: Record<string, string>, query: Record<string, unknown>, now: Date): SeasonQuery {
  const maxYear = now.getUTCFullYear() + 1
  const year = Number(params.year)
  if (!/^\d+$/.test(params.year) || year < MIN_SEASON_YEAR || year > maxYear) {
    throw new SeasonInputError(`year inválido: ${received(params.year)}, esperado inteiro entre ${MIN_SEASON_YEAR} e ${maxYear}`)
  }
  const season = SEASON_NAMES.find((name) => name === params.season)
  if (!season) throw new SeasonInputError(`season inválido: ${received(params.season)}, esperado ${SEASON_NAMES.join('|')}`)
  return { kind: 'season', year, season, type: parseAnimeType(query.type) }
}
