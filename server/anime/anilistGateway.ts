import type { AniListConfig } from '../config.js'
import { describeFetchFailure } from '../describeFetchFailure.js'
import { toAnimeSeasonItems, type RawAniListMedia } from './anilistMedia.js'
import type { AnimeSeasonList } from './animeSeasonTypes.js'
import { RateLimiter, realClock } from './rateLimiter.js'
import type { AnimeType, SeasonName } from './seasonCache.js'

/** What the routes need from the season source; the fake in server/test implements it too. */
export interface AnimeSeasonGateway {
  readSeason(year: number, season: SeasonName, type: AnimeType): Promise<AnimeSeasonList>
  readUpcoming(type: AnimeType): Promise<AnimeSeasonList>
}

/** Any upstream failure, with a message safe to return to the browser. */
export class AnimeSeasonGatewayError extends Error {}

export interface AniListGatewayDeps {
  limiter: { acquire(): Promise<void> }
  sleep(ms: number): Promise<void>
  timeoutMs: number
  fetch: typeof fetch
}

export const ANILIST_TIMEOUT_MS = 10000
export const ANILIST_MAX_ATTEMPTS = 3
/** 10 pages of 50: about 500 upcoming anime, the cap anime-season settled on. */
export const UPCOMING_MAX_PAGES = 10
// A TV season runs 2–3 pages; this only stops an upstream that never says hasNextPage: false.
const SEASON_MAX_PAGES = 20
const RETRY_BASE_MS = 1000
const HTTP_TOO_MANY_REQUESTS = 429
const HTTP_SERVER_ERROR = 500

const SEASON_ENUM: Record<SeasonName, string> = { winter: 'WINTER', spring: 'SPRING', summer: 'SUMMER', fall: 'FALL' }
const FORMATS: Record<AnimeType, string[]> = { tv: ['TV', 'TV_SHORT'], movie: ['MOVIE'], ova: ['OVA'], special: ['SPECIAL'], ona: ['ONA'] }

/** One query for both lists; values travel only as variables, never inside the text (door 4). */
export const SEASON_QUERY = `query ($page: Int, $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $formats: [MediaFormat]) {
  Page(page: $page, perPage: 50) {
    pageInfo { hasNextPage }
    media(type: ANIME, season: $season, seasonYear: $seasonYear, status: $status, format_in: $formats, sort: POPULARITY_DESC) {
      id idMal siteUrl title { romaji english } description(asHtml: false) format episodes averageScore popularity status isAdult
      startDate { year month day } airingSchedule(perPage: 1) { nodes { airingAt } } studios(isMain: true) { nodes { name } } genres
      coverImage { large extraLarge }
    }
  }
}`

type SeasonVariables = { season: string; seasonYear: number; formats: string[] } | { status: 'NOT_YET_RELEASED'; formats: string[] }

interface RawAniListPage {
  pageInfo: { hasNextPage: boolean }
  media: RawAniListMedia[]
}

/** A GraphQL answer: `errors` on failure, `data.Page` on success. */
interface RawAniListBody {
  data?: { Page?: Partial<RawAniListPage> } | null
  errors?: { message?: string }[]
}

type PageAttempt = { page: RawAniListPage } | { retry: boolean; reason: string; retryAfterMs: number | null }

/**
 * AniList GraphQL over native fetch: every page, each call through the shared limiter (door 2),
 * up to 3 attempts per page on 429, 5xx, timeout or connection failure.
 * @example const list = await new GraphqlAniListGateway(config.anilist).readSeason(2026, 'fall', 'tv')
 */
export class GraphqlAniListGateway implements AnimeSeasonGateway {
  private readonly deps: AniListGatewayDeps

  constructor(private readonly config: AniListConfig, deps: Partial<AniListGatewayDeps> = {}) {
    this.deps = { limiter: new RateLimiter(), sleep: realClock.sleep, timeoutMs: ANILIST_TIMEOUT_MS, fetch: (input, init) => fetch(input, init), ...deps }
  }

  readSeason(year: number, season: SeasonName, type: AnimeType): Promise<AnimeSeasonList> {
    const variables = { season: SEASON_ENUM[season], seasonYear: year, formats: FORMATS[type] }
    return this.readAllPages(variables, `${season} ${year}`, SEASON_MAX_PAGES)
  }

  readUpcoming(type: AnimeType): Promise<AnimeSeasonList> {
    return this.readAllPages({ status: 'NOT_YET_RELEASED', formats: FORMATS[type] }, 'anunciados', UPCOMING_MAX_PAGES)
  }

  private async readAllPages(variables: SeasonVariables, label: string, maxPages: number): Promise<AnimeSeasonList> {
    const raw: RawAniListMedia[] = []
    for (let page = 1; page <= maxPages; page++) {
      const body = await this.readPage({ ...variables, page }, `${label}, página ${page}`)
      raw.push(...body.media)
      if (!body.pageInfo.hasNextPage) return { items: toAnimeSeasonItems(raw), truncated: false }
    }
    return { items: toAnimeSeasonItems(raw), truncated: true }
  }

  private async readPage(variables: SeasonVariables & { page: number }, label: string): Promise<RawAniListPage> {
    for (let attempt = 1; ; attempt++) {
      const result = await this.attemptPage(variables)
      if ('page' in result) return result.page
      if (!result.retry || attempt === ANILIST_MAX_ATTEMPTS) {
        const tries = attempt > 1 ? ` após ${attempt} tentativas` : ''
        throw new AnimeSeasonGatewayError(`AniList falhou em ${label}: ${result.reason}${tries}`)
      }
      await this.deps.sleep(result.retryAfterMs ?? RETRY_BASE_MS * attempt)
    }
  }

  private async attemptPage(variables: SeasonVariables & { page: number }): Promise<PageAttempt> {
    await this.deps.limiter.acquire()
    let res: Response
    try {
      res = await this.deps.fetch(this.config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: SEASON_QUERY, variables }),
        signal: AbortSignal.timeout(this.deps.timeoutMs),
      })
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
  let body: RawAniListBody
  try {
    body = (await res.json()) as RawAniListBody
  } catch {
    return { retry: false, reason: 'resposta não é JSON', retryAfterMs: null }
  }
  if (body.errors?.length) return { retry: false, reason: body.errors[0].message ?? 'erro GraphQL', retryAfterMs: null }
  const page = body.data?.Page
  if (Array.isArray(page?.media) && typeof page?.pageInfo?.hasNextPage === 'boolean') return { page: page as RawAniListPage }
  return { retry: false, reason: 'resposta sem data.Page', retryAfterMs: null }
}
