import { SonarrGatewayError, SonarrNotFoundError, type SonarrGateway, type SonarrPoster, type SonarrStatusInfo } from '../sonarr/sonarrGateway.js'
import type { SeriesDetail, SeriesSummary } from '../sonarr/seriesDetail.js'
import type { ReleaseQuery, ReleaseSummary } from '../sonarr/releases.js'
import type { MissingPage } from '../sonarr/missingEpisodes.js'
import type { AddOptions, AddSeriesInput, SeriesLookupResult } from '../sonarr/seriesLookup.js'

export interface FakeSonarrData {
  status?: SonarrStatusInfo
  series?: SeriesSummary[]
  details?: Record<number, SeriesDetail>
  posters?: Record<number, SonarrPoster>
  releases?: ReleaseSummary[]
  lookup?: SeriesLookupResult[]
  addOptions?: AddOptions
  addedSeriesId?: number
  missing?: MissingPage
  /** Throws this error from every write, e.g. a SonarrSeasonNotFoundError. */
  writeError?: Error
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

  async setEpisodesMonitored(episodeIds: number[], monitored: boolean): Promise<void> {
    this.write(`setEpisodesMonitored:${JSON.stringify(episodeIds)}:${monitored}`)
  }

  async setSeasonMonitored(seriesId: number, seasonNumber: number, monitored: boolean): Promise<void> {
    this.write(`setSeasonMonitored:${seriesId}:${seasonNumber}:${monitored}`)
  }

  async searchEpisode(episodeId: number): Promise<void> {
    this.write(`searchEpisode:${episodeId}`)
  }

  async searchSeason(seriesId: number, seasonNumber: number): Promise<void> {
    this.write(`searchSeason:${seriesId}:${seasonNumber}`)
  }

  async listReleases(query: ReleaseQuery): Promise<ReleaseSummary[]> {
    this.enter(`listReleases:${JSON.stringify(query)}`)
    return this.data.releases ?? []
  }

  async grabRelease(guid: string, indexerId: number): Promise<void> {
    this.write(`grabRelease:${guid}:${indexerId}`)
  }

  async lookupSeries(term: string): Promise<SeriesLookupResult[]> {
    this.enter(`lookupSeries:${term}`)
    return this.data.lookup ?? []
  }

  async readAddOptions(): Promise<AddOptions> {
    this.enter('readAddOptions')
    return this.data.addOptions ?? { qualityProfiles: [], rootFolders: [] }
  }

  async addSeries(input: AddSeriesInput): Promise<number> {
    this.write(`addSeries:${JSON.stringify(input)}`)
    return this.data.addedSeriesId ?? 1
  }

  async listMissing(page: number): Promise<MissingPage> {
    this.enter(`listMissing:${page}`)
    return this.data.missing ?? { page, pageSize: 20, totalRecords: 0, records: [] }
  }

  async searchEpisodes(episodeIds: number[]): Promise<void> {
    this.write(`searchEpisodes:${JSON.stringify(episodeIds)}`)
  }

  async searchAllMissing(): Promise<void> {
    this.write('searchAllMissing')
  }

  private write(call: string): void {
    this.enter(call)
    if (this.data.writeError) throw this.data.writeError
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
