import type { AiringStatus, AnimeSeasonItem, Weekday } from './animeSeasonTypes.js'

/** The fields of an AniList `Media` the season query asks for (door 4). */
export interface RawAniListMedia {
  id: number
  idMal?: number | null
  siteUrl: string
  title: { romaji: string; english?: string | null }
  description?: string | null
  format?: string | null
  episodes?: number | null
  averageScore?: number | null
  popularity?: number | null
  status?: string | null
  isAdult?: boolean | null
  startDate?: { year?: number | null; month?: number | null; day?: number | null } | null
  airingSchedule?: { nodes: { airingAt: number }[] } | null
  studios?: { nodes: { name: string }[] } | null
  genres?: string[] | null
  coverImage?: { large?: string | null; extraLarge?: string | null } | null
}

const STATUSES: Record<string, AiringStatus> = { RELEASING: 'airing', NOT_YET_RELEASED: 'notYetAired', FINISHED: 'finished' }
// getUTCDay order: Sunday first.
const WEEKDAYS: Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const JST_OFFSET_S = 9 * 60 * 60
const SCORE_SCALE = 10
const ENTITIES: Record<string, string> = { '&amp;': '&', '&quot;': '"', '&#039;': "'", '&lt;': '<', '&gt;': '>' }

/**
 * Reduces an AniList media to the season card shape (door 3).
 * @example toAnimeSeasonItem(media).url // 'https://myanimelist.net/anime/61987'
 */
export function toAnimeSeasonItem(raw: RawAniListMedia): AnimeSeasonItem {
  return {
    id: raw.id,
    url: raw.idMal ? `https://myanimelist.net/anime/${raw.idMal}` : raw.siteUrl,
    imageUrl: raw.coverImage?.extraLarge ?? raw.coverImage?.large ?? null,
    title: raw.title.romaji,
    titleEnglish: raw.title.english ?? null,
    synopsis: raw.description ? toPlainText(raw.description) : null,
    type: raw.format ?? null,
    episodes: raw.episodes ?? null,
    score: typeof raw.averageScore === 'number' ? raw.averageScore / SCORE_SCALE : null,
    scoredBy: null,
    members: raw.popularity ?? null,
    status: STATUSES[raw.status ?? ''] ?? null,
    airedFrom: toIsoDate(raw.startDate),
    broadcast: toJstBroadcast(raw.airingSchedule?.nodes[0]?.airingAt),
    studios: (raw.studios?.nodes ?? []).map(({ name }) => name),
    genres: raw.genres ?? [],
    isAdult: raw.isAdult === true,
  }
}

/**
 * Weekday and HH:mm in JST of a unix instant; JST has no daylight saving, so a fixed +9 h is exact.
 * @example toJstBroadcast(1790949600) // { day: 'friday', time: '23:00' }
 */
export function toJstBroadcast(airingAt: number | undefined): AnimeSeasonItem['broadcast'] {
  if (airingAt === undefined) return null
  const jst = new Date((airingAt + JST_OFFSET_S) * 1000)
  const time = `${String(jst.getUTCHours()).padStart(2, '0')}:${String(jst.getUTCMinutes()).padStart(2, '0')}`
  return { day: WEEKDAYS[jst.getUTCDay()], time }
}

function toIsoDate(date: RawAniListMedia['startDate']): string | null {
  if (!date?.year || !date.month || !date.day) return null
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).toISOString()
}

/** AniList descriptions carry `<br>`, `<i>` and HTML entities even with `asHtml: false`. */
function toPlainText(description: string): string {
  return description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|quot|#039|lt|gt);/g, (entity) => ENTITIES[entity])
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Maps every page's media, keeping the first of any repeated `id`.
 * @example toAnimeSeasonItems([a, aAgain]).length // 1
 */
export function toAnimeSeasonItems(raw: RawAniListMedia[]): AnimeSeasonItem[] {
  const seen = new Set<number>()
  return raw.filter(({ id }) => !seen.has(id) && seen.add(id)).map(toAnimeSeasonItem)
}
