/** The fields of a Sonarr API v3 `/series` item this server reads. */
export interface RawSeries {
  id: number
  title: string
  sortTitle: string
  alternateTitles?: { title: string }[]
  year: number
  status: string
  network?: string
  overview?: string
  /** ISO date the series was added to Sonarr */
  added?: string
  statistics?: { episodeFileCount: number; episodeCount: number; sizeOnDisk: number }
  seasons: { seasonNumber: number; statistics?: { episodeFileCount: number; episodeCount: number } }[]
}

/** The fields of a Sonarr API v3 `/episode` item this server reads. */
export interface RawEpisode {
  id: number
  seasonNumber: number
  episodeNumber: number
  title: string
  airDateUtc?: string
  hasFile: boolean
  monitored: boolean
}

export type EpisodeState = 'downloaded' | 'missing' | 'unaired' | 'tba'

export interface SeriesSummary {
  id: number
  title: string
  alternateTitles: string[]
  year: number
  status: string
  network: string
  episodeFileCount: number
  episodeCount: number
  /** ISO date; empty when Sonarr omits it */
  added: string
}

export interface EpisodeDetail {
  id: number
  episodeNumber: number
  title: string
  airDateUtc: string | null
  state: EpisodeState
  monitored: boolean
}

export interface SeasonDetail {
  seasonNumber: number
  episodeFileCount: number
  episodeCount: number
  episodes: EpisodeDetail[]
}

export interface SeriesDetail extends Omit<SeriesSummary, 'alternateTitles' | 'added'> {
  overview: string
  sizeOnDisk: number
  seasons: SeasonDetail[]
}

const SPECIALS_SEASON = 0

/**
 * What the screen shows for an episode; the PR 3 "missing" list reuses this rule.
 * @example deriveEpisodeState(episode, new Date()) // 'missing'
 */
export function deriveEpisodeState(episode: RawEpisode, now: Date): EpisodeState {
  if (episode.hasFile) return 'downloaded'
  if (!episode.airDateUtc) return 'tba'
  return new Date(episode.airDateUtc) > now ? 'unaired' : 'missing'
}

/**
 * @example toSeriesSummary(await sonarr.get('/series/1'))
 */
export function toSeriesSummary(series: RawSeries): SeriesSummary {
  return {
    id: series.id,
    title: series.title,
    alternateTitles: (series.alternateTitles ?? []).map((alternate) => alternate.title),
    year: series.year,
    status: series.status,
    network: series.network ?? '',
    episodeFileCount: series.statistics?.episodeFileCount ?? 0,
    episodeCount: series.statistics?.episodeCount ?? 0,
    added: series.added ?? '',
  }
}

/**
 * Newest season first and specials last, because the airing season is the one people open.
 * @example buildSeriesDetail(series, episodes, new Date())
 */
export function buildSeriesDetail(series: RawSeries, episodes: RawEpisode[], now: Date): SeriesDetail {
  const { id, title, year, status, network, episodeFileCount, episodeCount } = toSeriesSummary(series)
  const seasons = [...series.seasons].sort(compareSeasons).map((season) => ({
    seasonNumber: season.seasonNumber,
    episodeFileCount: season.statistics?.episodeFileCount ?? 0,
    episodeCount: season.statistics?.episodeCount ?? 0,
    episodes: episodesOfSeason(episodes, season.seasonNumber, now),
  }))
  return {
    id, title, year, status, network, episodeFileCount, episodeCount,
    overview: series.overview ?? '',
    sizeOnDisk: series.statistics?.sizeOnDisk ?? 0,
    seasons,
  }
}

function compareSeasons(a: { seasonNumber: number }, b: { seasonNumber: number }): number {
  if (a.seasonNumber === SPECIALS_SEASON) return 1
  if (b.seasonNumber === SPECIALS_SEASON) return -1
  return b.seasonNumber - a.seasonNumber
}

function episodesOfSeason(episodes: RawEpisode[], seasonNumber: number, now: Date): EpisodeDetail[] {
  return episodes
    .filter((episode) => episode.seasonNumber === seasonNumber)
    .sort((a, b) => a.episodeNumber - b.episodeNumber)
    .map((episode) => ({
      id: episode.id,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      airDateUtc: episode.airDateUtc ?? null,
      state: deriveEpisodeState(episode, now),
      monitored: episode.monitored,
    }))
}
