/** The fields of a Sonarr API v3 `/calendar` item (with `includeSeries=true`) this server reads. */
export interface RawCalendarEpisode {
  id: number
  seriesId: number
  seasonNumber: number
  episodeNumber: number
  title: string
  airDateUtc?: string
  hasFile: boolean
  monitored: boolean
  series?: { title: string }
}

/** Unlike the detail's EpisodeState: no `tba` (the calendar only has dated episodes) and an `unmonitored` state. */
export type CalendarStatus = 'downloaded' | 'missing' | 'unaired' | 'unmonitored'

export interface CalendarItem {
  episodeId: number
  seriesId: number
  seriesTitle: string
  seasonNumber: number
  episodeNumber: number
  title: string
  airDateUtc: string
  status: CalendarStatus
}

/** A UTC window the browser computed from its local week (door 2). */
export interface CalendarWindow {
  start: string
  end: string
  unmonitored: boolean
}

/** Door 1: a downloaded file wins over monitoring, monitoring over air date. */
function deriveCalendarStatus(episode: RawCalendarEpisode, airDateUtc: string, now: Date): CalendarStatus {
  if (episode.hasFile) return 'downloaded'
  if (!episode.monitored) return 'unmonitored'
  return new Date(airDateUtc) > now ? 'unaired' : 'missing'
}

/**
 * Flat items for the week grid; episodes without an air date have no day to sit on, so they drop.
 * @example toCalendarItems(await sonarr.get('/calendar'), new Date())[0].status // 'missing'
 */
export function toCalendarItems(episodes: RawCalendarEpisode[], now: Date): CalendarItem[] {
  return episodes.flatMap((episode) => {
    const { airDateUtc } = episode
    if (!airDateUtc) return []
    return [{
      episodeId: episode.id,
      seriesId: episode.seriesId,
      seriesTitle: episode.series?.title ?? '',
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      airDateUtc,
      status: deriveCalendarStatus(episode, airDateUtc, now),
    }]
  })
}
