import type { JikanConfig } from '../config.js'
import { describeFetchFailure } from '../describeFetchFailure.js'
import { toAnimeSeasonItems, type AnimeSeasonList, type RawJikanAnime } from './jikanSeasonItems.js'
import { JikanRateLimiter, realClock } from './jikanRateLimiter.js'
import type { AnimeType, SeasonName } from './seasonCache.js'

/** What the routes need from Jikan; the fake in server/test implements it too. */
export interface JikanGateway {
  readSeason(year: number, season: SeasonName, type: AnimeType): Promise<AnimeSeasonList>
  readUpcoming(type: AnimeType): Promise<AnimeSeasonList>
}

/** Any Jikan failure, with a message safe to return to the browser. */
export class JikanGatewayError extends Error {}

export interface JikanGatewayDeps {
  limiter: { acquire(): Promise<void> }
  sleep(ms: number): Promise<void>
  timeoutMs: number
  fetch: typeof fetch
}

export const JIKAN_TIMEOUT_MS = 10000
export const JIKAN_MAX_ATTEMPTS = 3
/** Upcoming runs 8–15 pages for TV; past 20 the list is cut and flagged (decision Q14). */
export const UPCOMING_MAX_PAGES = 20
// A season runs 3–6 pages; this only stops an upstream that never says has_next_page: false.
const SEASON_MAX_PAGES = 40
const RETRY_BASE_MS = 1000
const HTTP_TOO_MANY_REQUESTS = 429
const HTTP_SERVER_ERROR = 500

interface RawJikanPage {
  data: RawJikanAnime[]
  pagination: { has_next_page: boolean }
}

type PageAttempt = { page: RawJikanPage } | { retry: boolean; reason: string; retryAfterMs: number | null }

/**
 * Jikan v4 season lists over native fetch: every page, each call through the shared limiter (door 3),
 * up to 3 attempts per page on 429, 5xx, timeout or connection failure.
 * @example const list = await new FetchJikanGateway(config.jikan).readSeason(2026, 'fall', 'tv')
 */
export class FetchJikanGateway implements JikanGateway {
  private readonly deps: JikanGatewayDeps

  constructor(private readonly config: JikanConfig, deps: Partial<JikanGatewayDeps> = {}) {
    this.deps = { limiter: new JikanRateLimiter(), sleep: realClock.sleep, timeoutMs: JIKAN_TIMEOUT_MS, fetch: (input, init) => fetch(input, init), ...deps }
  }

  readSeason(year: number, season: SeasonName, type: AnimeType): Promise<AnimeSeasonList> {
    return this.readAllPages(`/seasons/${year}/${season}`, type, `${season} ${year}`, SEASON_MAX_PAGES)
  }

  readUpcoming(type: AnimeType): Promise<AnimeSeasonList> {
    return this.readAllPages('/seasons/upcoming', type, 'anunciados', UPCOMING_MAX_PAGES)
  }

  private async readAllPages(path: string, type: AnimeType, label: string, maxPages: number): Promise<AnimeSeasonList> {
    const raw: RawJikanAnime[] = []
    for (let page = 1; page <= maxPages; page++) {
      const body = await this.readPage(`${path}?filter=${type}&page=${page}`, `${label}, página ${page}`)
      raw.push(...body.data)
      if (!body.pagination.has_next_page) return { items: toAnimeSeasonItems(raw), truncated: false }
    }
    return { items: toAnimeSeasonItems(raw), truncated: true }
  }

  private async readPage(pathAndQuery: string, label: string): Promise<RawJikanPage> {
    for (let attempt = 1; ; attempt++) {
      const result = await this.attemptPage(pathAndQuery)
      if ('page' in result) return result.page
      if (!result.retry || attempt === JIKAN_MAX_ATTEMPTS) {
        const tries = attempt > 1 ? ` após ${attempt} tentativas` : ''
        throw new JikanGatewayError(`Jikan falhou em ${label}: ${result.reason}${tries}`)
      }
      await this.deps.sleep(result.retryAfterMs ?? RETRY_BASE_MS * attempt)
    }
  }

  private async attemptPage(pathAndQuery: string): Promise<PageAttempt> {
    await this.deps.limiter.acquire()
    let res: Response
    try {
      res = await this.deps.fetch(`${this.config.url.replace(/\/$/, '')}${pathAndQuery}`, { signal: AbortSignal.timeout(this.deps.timeoutMs) })
    } catch (error: unknown) {
      return { retry: true, reason: describeFetchFailure(error), retryAfterMs: null }
    }
    if (res.status === HTTP_TOO_MANY_REQUESTS || res.status >= HTTP_SERVER_ERROR) {
      return { retry: true, reason: `HTTP ${res.status}`, retryAfterMs: parseRetryAfter(res.headers.get('retry-after')) }
    }
    if (!res.ok) return { retry: false, reason: `HTTP ${res.status}`, retryAfterMs: null }
    return parsePage(res)
  }
}

/** `Retry-After` in seconds; an HTTP-date or garbage falls back to the linear backoff. */
function parseRetryAfter(header: string | null): number | null {
  const seconds = Number(header)
  return header !== null && header.trim() !== '' && Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null
}

async function parsePage(res: Response): Promise<PageAttempt> {
  let body: unknown
  try {
    body = await res.json()
  } catch {
    return { retry: false, reason: 'resposta não é JSON', retryAfterMs: null }
  }
  if (isJikanPage(body)) return { page: body }
  return { retry: false, reason: 'resposta sem data/pagination', retryAfterMs: null }
}

function isJikanPage(body: unknown): body is RawJikanPage {
  const page = body as Partial<RawJikanPage> | null
  return Array.isArray(page?.data) && typeof page?.pagination?.has_next_page === 'boolean'
}
