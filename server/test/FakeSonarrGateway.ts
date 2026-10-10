import { SonarrGatewayError, SonarrNotFoundError, type SonarrGateway, type SonarrPoster, type SonarrStatusInfo } from '../sonarr/sonarrGateway.js'
import type { SeriesDetail, SeriesSummary } from '../sonarr/seriesDetail.js'

export interface FakeSonarrData {
  status?: SonarrStatusInfo
  series?: SeriesSummary[]
  details?: Record<number, SeriesDetail>
  posters?: Record<number, SonarrPoster>
  failWith?: string
}

/**
 * In-memory gateway for route tests; unknown ids throw SonarrNotFoundError like the real one.
 * @example new FakeSonarrGateway({ series: [wire] })
 */
export class FakeSonarrGateway implements SonarrGateway {
  readonly calls: string[] = []

  constructor(private readonly data: FakeSonarrData = {}) {}

  async readStatus(): Promise<SonarrStatusInfo> {
    this.enter('readStatus')
    return this.data.status ?? { version: '4.0.9.2244', health: [], queueCount: 0, rootFolders: [] }
  }

  async listSeries(): Promise<SeriesSummary[]> {
    this.enter('listSeries')
    return this.data.series ?? []
  }

  async getSeriesDetail(seriesId: number): Promise<SeriesDetail> {
    this.enter(`getSeriesDetail:${seriesId}`)
    return this.found(this.data.details?.[seriesId], seriesId)
  }

  async getPoster(seriesId: number): Promise<SonarrPoster> {
    this.enter(`getPoster:${seriesId}`)
    return this.found(this.data.posters?.[seriesId], seriesId)
  }

  private enter(call: string): void {
    this.calls.push(call)
    if (this.data.failWith) throw new SonarrGatewayError(this.data.failWith)
  }

  private found<T>(value: T | undefined, seriesId: number): T {
    if (value === undefined) throw new SonarrNotFoundError(seriesId)
    return value
  }
}
