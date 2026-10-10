import type { SonarrConfig } from '../config.js'
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
}

/** Any Sonarr failure, with a message safe to return to the browser (502). */
export class SonarrGatewayError extends Error {}

/** Sonarr answered 404 for a series id (404). */
export class SonarrNotFoundError extends Error {
  constructor(readonly seriesId: number) {
    super(`série ${seriesId} não encontrada no Sonarr`)
  }
}

export const SONARR_TIMEOUT_MS = 10000

const HTTP_UNAUTHORIZED = 401
const HTTP_NOT_FOUND = 404

type Clock = () => Date

/**
 * Sonarr API v3 over native fetch: the key goes in `X-Api-Key`, never in the URL.
 * @example const series = await new FetchSonarrGateway(config.sonarr).listSeries()
 */
export class FetchSonarrGateway implements SonarrGateway {
  constructor(
    private readonly config: SonarrConfig,
    readonly timeoutMs = SONARR_TIMEOUT_MS,
    private readonly now: Clock = () => new Date(),
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
    const [series, episodes] = await Promise.all([
      this.getJson<RawSeries>(`/series/${seriesId}`, seriesId),
      this.getJson<RawEpisode[]>(`/episode?seriesId=${seriesId}`, seriesId),
    ])
    return buildSeriesDetail(series, episodes, this.now())
  }

  async getPoster(seriesId: number): Promise<SonarrPoster> {
    const res = await this.request(`/mediacover/${seriesId}/poster-500.jpg`, seriesId)
    return { contentType: res.headers.get('content-type') ?? 'image/jpeg', bytes: await res.arrayBuffer() }
  }

  private async getJson<T>(path: string, seriesId?: number): Promise<T> {
    return (await (await this.request(path, seriesId)).json()) as T
  }

  /** `seriesId` marks calls where a 404 means "no such series" rather than a broken Sonarr. */
  private async request(path: string, seriesId?: number): Promise<Response> {
    const res = await this.fetchOrFail(path)
    if (res.ok) return res
    if (res.status === HTTP_UNAUTHORIZED) throw new SonarrGatewayError('Sonarr recusou a API key (SONARR_API_KEY)')
    if (res.status === HTTP_NOT_FOUND && seriesId !== undefined) throw new SonarrNotFoundError(seriesId)
    throw this.unavailable(`HTTP ${res.status} em ${path.split('?')[0]}`)
  }

  private async fetchOrFail(path: string): Promise<Response> {
    const url = `${this.config.url.replace(/\/$/, '')}/api/v3${path}`
    try {
      return await fetch(url, {
        headers: { 'X-Api-Key': this.config.apiKey },
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (error: unknown) {
      throw this.unavailable(error instanceof Error ? error.message : String(error))
    }
  }

  private unavailable(reason: string): SonarrGatewayError {
    return new SonarrGatewayError(`Sonarr indisponível em ${this.config.url}: ${reason}`)
  }
}
