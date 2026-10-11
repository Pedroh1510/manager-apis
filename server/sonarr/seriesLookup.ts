/** The fields of a Sonarr API v3 `/series/lookup` item this server reads or sends back on add. */
export interface RawLookupSeries {
  /** Present only when the series is already in the library. */
  id?: number
  tvdbId: number
  title: string
  year: number
  network?: string
  overview?: string
  genres?: string[]
  remotePoster?: string
  seasons: unknown[]
  images: unknown[]
}

export interface SeriesLookupResult {
  tvdbId: number
  title: string
  year: number
  network: string | null
  overview: string | null
  genres: string[]
  remotePoster: string | null
  seriesId: number | null
}

export const SERIES_TYPES = ['standard', 'anime', 'daily'] as const
export type SeriesType = (typeof SERIES_TYPES)[number]

/** Passed to Sonarr's `addOptions.monitor` as is (decision A5). */
export const MONITOR_OPTIONS = ['all', 'future', 'none', 'firstSeason', 'lastSeason'] as const
export type MonitorOption = (typeof MONITOR_OPTIONS)[number]

export interface AddSeriesInput {
  tvdbId: number
  qualityProfileId: number
  rootFolderPath: string
  seriesType: SeriesType
  monitor: MonitorOption
  searchForMissingEpisodes: boolean
}

export interface AddOptions {
  qualityProfiles: { id: number; name: string }[]
  rootFolders: { path: string; freeSpace: number }[]
}

/** @example toLookupResult(rawFromSonarr).seriesId // null when not in the library */
export function toLookupResult(series: RawLookupSeries): SeriesLookupResult {
  return {
    tvdbId: series.tvdbId,
    title: series.title,
    year: series.year,
    network: series.network || null,
    overview: series.overview || null,
    genres: series.genres ?? [],
    remotePoster: series.remotePoster || null,
    seriesId: series.id ?? null,
  }
}

/**
 * Sonarr's POST /series body: identity from the lookup, choices from the admin (door 1).
 * @example buildAddSeriesBody(lookup, input).addOptions // { monitor: 'all', searchForMissingEpisodes: true }
 */
export function buildAddSeriesBody(series: RawLookupSeries, input: AddSeriesInput): Record<string, unknown> {
  const { qualityProfileId, rootFolderPath, seriesType, monitor, searchForMissingEpisodes } = input
  return {
    title: series.title,
    tvdbId: series.tvdbId,
    seasons: series.seasons,
    images: series.images,
    qualityProfileId,
    rootFolderPath,
    seriesType,
    seasonFolder: true,
    monitored: true,
    addOptions: { monitor, searchForMissingEpisodes },
  }
}
