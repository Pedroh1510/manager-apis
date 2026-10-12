/** The fields of a Sonarr API v3 `/release` item this server reads. */
export interface RawRelease {
  guid: string
  indexerId: number
  title: string
  indexer: string
  quality?: { quality?: { name?: string } }
  size: number
  seeders?: number | null
  leechers?: number | null
  ageHours: number
  approved: boolean
  /** Sonarr v4 sends strings; older builds sent `{ reason }` objects. */
  rejections?: (string | { reason: string })[]
}

export interface ReleaseSummary {
  guid: string
  indexerId: number
  title: string
  indexer: string
  quality: string
  size: number
  seeders: number | null
  leechers: number | null
  ageHours: number
  approved: boolean
  rejections: string[]
}

/** Either one episode or one whole season, as Sonarr's `/release` accepts. */
export type ReleaseQuery = { episodeId: number } | { seriesId: number; seasonNumber: number }

/**
 * @example toReleaseSummary(rawFromSonarr).quality // 'WEBDL-1080p'
 */
export function toReleaseSummary(release: RawRelease): ReleaseSummary {
  return {
    guid: release.guid,
    indexerId: release.indexerId,
    title: release.title,
    indexer: release.indexer,
    quality: release.quality?.quality?.name ?? '',
    size: release.size,
    seeders: release.seeders ?? null,
    leechers: release.leechers ?? null,
    ageHours: release.ageHours,
    approved: release.approved,
    rejections: (release.rejections ?? []).map((rejection) => (typeof rejection === 'string' ? rejection : rejection.reason)),
  }
}

/**
 * Approved first; within each group Sonarr's own ranking stays (filter keeps order).
 * @example orderReleases(releases)[0].approved // true when any release is approved
 */
export function orderReleases(releases: ReleaseSummary[]): ReleaseSummary[] {
  return [...releases.filter((release) => release.approved), ...releases.filter((release) => !release.approved)]
}
