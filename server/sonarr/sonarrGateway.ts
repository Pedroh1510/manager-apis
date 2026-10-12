import type { SonarrConfig } from '../config.js'
import { orderReleases, toReleaseSummary, type RawRelease, type ReleaseQuery, type ReleaseSummary } from './releases.js'
import {
  buildSeriesDetail,
  toSeriesSummary,
  type RawEpisode,
  type RawSeries,
  type SeriesDetail,
  type SeriesSummary,
} from './seriesDetail.js'

export interface SonarrHealthItem {
  type: string
  message: string
}

export interface SonarrStatusInfo {
  version: string
  health: SonarrHealthItem[]
  queueCount: number
  rootFolders: { path: string; freeSpace: number }[]
}

export interface SonarrPoster {
  contentType: string
  bytes: ArrayBuffer
}

/** What the routes need from Sonarr; the fake in server/test implements it too. */
export interface SonarrGateway {
  readStatus(): Promise<SonarrStatusInfo>
  listSeries(): Promise<SeriesSummary[]>
  getSeriesDetail(seriesId: number): Promise<SeriesDetail>
  getPoster(seriesId: number): Promise<SonarrPoster>
  setEpisodesMonitored(episodeIds: number[], monitored: boolean): Promise<void>
  setSeasonMonitored(seriesId: number, seasonNumber: number, monitored: boolean): Promise<void>
  searchEpisode(episodeId: number): Promise<void>
  searchSeason(seriesId: number, seasonNumber: number): Promise<void>
  listReleases(query: ReleaseQuery): Promise<ReleaseSummary[]>
  grabRelease(guid: string, indexerId: number): Promise<void>
}

/** Any Sonarr failure, with a message safe to return to the browser (502). */
export class SonarrGatewayError extends Error {}

/** Sonarr answered 404 for a series id (404). */
export class SonarrNotFoundError extends Error {
  constructor(readonly seriesId: number) {
    super(`série ${seriesId} não encontrada no Sonarr`)
  }
}

/** The series exists but has no such season (404). */
export class SonarrSeasonNotFoundError extends Error {
  constructor(seriesId: number, seasonNumber: number) {
    super(`temporada ${seasonNumber} não encontrada na série ${seriesId}`)
  }
}

/** Sonarr forgot the release: it only caches the last interactive search for ~30 min (404). */
export class SonarrReleaseExpiredError extends Error {
  constructor() {
    super('release não está mais no cache do Sonarr: refaça a busca interativa')
  }
}

export const SONARR_TIMEOUT_MS = 10000
export const SONARR_RELEASE_TIMEOUT_MS = 90000

const HTTP_UNAUTHORIZED = 401
const HTTP_NOT_FOUND = 404

type Clock = () => Date

interface RequestOptions {
  method?: 'GET' | 'PUT' | 'POST'
  body?: unknown
  timeoutMs?: number
  notFound?: () => Error
}

/**
 * Sonarr API v3 over native fetch: the key goes in `X-Api-Key`, never in the URL.
 * @example const series = await new FetchSonarrGateway(config.sonarr).listSeries()
 */
export class FetchSonarrGateway implements SonarrGateway {
  constructor(
    private readonly config: SonarrConfig,
    readonly timeoutMs = SONARR_TIMEOUT_MS,
    private readonly now: Clock = () => new Date(),
    /** Interactive search queries every indexer live, so it gets its own, longer budget. */
    readonly releaseTimeoutMs = SONARR_RELEASE_TIMEOUT_MS,
  ) {}

  async readStatus(): Promise<SonarrStatusInfo> {
    const [system, health, queue, rootFolders] = await Promise.all([
      this.getJson<{ version: string }>('/system/status'),
      this.getJson<SonarrHealthItem[]>('/health'),
      this.getJson<{ totalCount: number }>('/queue/status'),
      this.getJson<{ path: string; freeSpace: number }[]>('/rootfolder'),
    ])
    return {
      version: system.version,
      health: health.map(({ type, message }) => ({ type, message })),
      queueCount: queue.totalCount,
      rootFolders: rootFolders.map(({ path, freeSpace }) => ({ path, freeSpace })),
    }
  }

  async listSeries(): Promise<SeriesSummary[]> {
    const series = await this.getJson<RawSeries[]>('/series')
    return [...series].sort((a, b) => a.sortTitle.localeCompare(b.sortTitle)).map(toSeriesSummary)
  }

  async getSeriesDetail(seriesId: number): Promise<SeriesDetail> {
    const notFound = () => new SonarrNotFoundError(seriesId)
    const [series, episodes] = await Promise.all([
      this.getJson<RawSeries>(`/series/${seriesId}`, { notFound }),
      this.getJson<RawEpisode[]>(`/episode?seriesId=${seriesId}`, { notFound }),
    ])
    return buildSeriesDetail(series, episodes, this.now())
  }

  async getPoster(seriesId: number): Promise<SonarrPoster> {
    const res = await this.request(`/mediacover/${seriesId}/poster-500.jpg`, { notFound: () => new SonarrNotFoundError(seriesId) })
    return { contentType: res.headers.get('content-type') ?? 'image/jpeg', bytes: await res.arrayBuffer() }
  }

  async setEpisodesMonitored(episodeIds: number[], monitored: boolean): Promise<void> {
    await this.request('/episode/monitor', { method: 'PUT', body: { episodeIds, monitored } })
  }

  /** Same as the Sonarr UI: the season flag (future episodes) and every existing episode of it. */
  async setSeasonMonitored(seriesId: number, seasonNumber: number, monitored: boolean): Promise<void> {
    const notFound = () => new SonarrNotFoundError(seriesId)
    const series = await this.getJson<RawSeries & Record<string, unknown>>(`/series/${seriesId}`, { notFound })
    if (!series.seasons.some((season) => season.seasonNumber === seasonNumber)) {
      throw new SonarrSeasonNotFoundError(seriesId, seasonNumber)
    }
    // Sonarr's PUT /series replaces the whole resource, so everything else goes back unchanged.
    const seasons = series.seasons.map((season) => (season.seasonNumber === seasonNumber ? { ...season, monitored } : season))
    await this.request(`/series/${seriesId}`, { method: 'PUT', body: { ...series, seasons }, notFound })
    const episodes = await this.getJson<RawEpisode[]>(`/episode?seriesId=${seriesId}`, { notFound })
    const episodeIds = episodes.filter((episode) => episode.seasonNumber === seasonNumber).map((episode) => episode.id)
    if (episodeIds.length) await this.setEpisodesMonitored(episodeIds, monitored)
  }

  async searchEpisode(episodeId: number): Promise<void> {
    await this.request('/command', { method: 'POST', body: { name: 'EpisodeSearch', episodeIds: [episodeId] } })
  }

  async searchSeason(seriesId: number, seasonNumber: number): Promise<void> {
    await this.request('/command', { method: 'POST', body: { name: 'SeasonSearch', seriesId, seasonNumber } })
  }

  async listReleases(query: ReleaseQuery): Promise<ReleaseSummary[]> {
    const params = new URLSearchParams(Object.entries(query).map(([key, value]): [string, string] => [key, String(value)]))
    const releases = await this.getJson<RawRelease[]>(`/release?${params}`, { timeoutMs: this.releaseTimeoutMs })
    return orderReleases(releases.map(toReleaseSummary))
  }

  async grabRelease(guid: string, indexerId: number): Promise<void> {
    await this.request('/release', { method: 'POST', body: { guid, indexerId }, notFound: () => new SonarrReleaseExpiredError() })
  }

  private async getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return (await (await this.request(path, options)).json()) as T
  }

  /** `notFound` marks calls where a 404 means a missing thing rather than a broken Sonarr. */
  private async request(path: string, options: RequestOptions = {}): Promise<Response> {
    const res = await this.fetchOrFail(path, options)
    if (res.ok) return res
    if (res.status === HTTP_UNAUTHORIZED) throw new SonarrGatewayError('Sonarr recusou a API key (SONARR_API_KEY)')
    if (res.status === HTTP_NOT_FOUND && options.notFound) throw options.notFound()
    throw this.unavailable(`HTTP ${res.status} em ${path.split('?')[0]}`)
  }

  private async fetchOrFail(path: string, { method = 'GET', body, timeoutMs = this.timeoutMs }: RequestOptions): Promise<Response> {
    const url = `${this.config.url.replace(/\/$/, '')}/api/v3${path}`
    const headers: Record<string, string> = { 'X-Api-Key': this.config.apiKey }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    try {
      return await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error: unknown) {
      throw this.unavailable(error instanceof Error ? error.message : String(error))
    }
  }

  private unavailable(reason: string): SonarrGatewayError {
    return new SonarrGatewayError(`Sonarr indisponível em ${this.config.url}: ${reason}`)
  }
}
