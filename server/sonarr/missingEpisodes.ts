export const MISSING_PAGE_SIZE = 20

/** The fields of a Sonarr API v3 `/wanted/missing` record (with `includeSeries=true`) this server reads. */
export interface RawMissingEpisode {
  id: number
  seriesId: number
  seasonNumber: number
  episodeNumber: number
  title: string
  airDateUtc?: string
  series?: { title: string }
}

export interface RawMissingPage {
  page: number
  pageSize: number
  totalRecords: number
  records: RawMissingEpisode[]
}

export interface MissingEpisode {
  episodeId: number
  seriesId: number
  seriesTitle: string
  seasonNumber: number
  episodeNumber: number
  title: string
  airDateUtc: string | null
}

export interface MissingPage {
  page: number
  pageSize: number
  totalRecords: number
  records: MissingEpisode[]
}

/** @example toMissingPage(rawFromSonarr).records[0].seriesTitle // 'The Wire' */
export function toMissingPage(raw: RawMissingPage): MissingPage {
  return {
    page: raw.page,
    pageSize: raw.pageSize,
    totalRecords: raw.totalRecords,
    records: raw.records.map((episode) => ({
      episodeId: episode.id,
      seriesId: episode.seriesId,
      seriesTitle: episode.series?.title ?? '',
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      airDateUtc: episode.airDateUtc ?? null,
    })),
  }
}
