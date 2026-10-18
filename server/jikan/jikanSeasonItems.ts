/** A `{ name }` entry of Jikan's `studios`, `genres`, `explicit_genres` and `themes`. */
export interface RawJikanNamed {
  name: string
}

/** The fields of a Jikan v4 anime this app reads; everything else is dropped (door 4). */
export interface RawJikanAnime {
  mal_id: number
  url: string
  images?: { webp?: { large_image_url?: string | null }; jpg?: { large_image_url?: string | null } }
  title: string
  title_english?: string | null
  synopsis?: string | null
  type?: string | null
  episodes?: number | null
  score?: number | null
  scored_by?: number | null
  members?: number | null
  status?: string | null
  rating?: string | null
  aired?: { from?: string | null }
  broadcast?: { day?: string | null; time?: string | null; timezone?: string | null; string?: string | null } | null
  studios?: RawJikanNamed[]
  genres?: RawJikanNamed[]
  explicit_genres?: RawJikanNamed[]
  themes?: RawJikanNamed[]
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type AiringStatus = 'airing' | 'notYetAired' | 'finished'

/** One card of the season screen (door 4). */
export interface AnimeSeasonItem {
  malId: number
  url: string
  imageUrl: string | null
  title: string
  titleEnglish: string | null
  synopsis: string | null
  type: string | null
  episodes: number | null
  score: number | null
  scoredBy: number | null
  members: number | null
  status: AiringStatus | null
  airedFrom: string | null
  /** Day and time in JST, as Jikan gives them. */
  broadcast: { day: Weekday; time: string } | null
  studios: string[]
  genres: string[]
  isAdult: boolean
}

/** What both season routes answer (door 4). */
export interface AnimeSeasonList {
  items: AnimeSeasonItem[]
  /** true when the upcoming list hit its page cap. */
  truncated: boolean
}

const WEEKDAYS: Record<string, Weekday> = {
  Mondays: 'monday', Tuesdays: 'tuesday', Wednesdays: 'wednesday', Thursdays: 'thursday', Fridays: 'friday', Saturdays: 'saturday', Sundays: 'sunday',
}

const STATUSES: Record<string, AiringStatus> = { 'Currently Airing': 'airing', 'Not yet aired': 'notYetAired', 'Finished Airing': 'finished' }

// Same rule as Jikan's own `sfw` filter: the Rx rating or an explicit genre.
const ADULT_RATING = 'Rx - Hentai'
const ADULT_GENRES = new Set(['Hentai', 'Erotica'])

const names = (list: RawJikanNamed[] | undefined) => (list ?? []).map(({ name }) => name)

/**
 * Reduces a Jikan anime to the season card shape.
 * @example toAnimeSeasonItem(raw).broadcast // { day: 'saturday', time: '23:00' }
 */
export function toAnimeSeasonItem(raw: RawJikanAnime): AnimeSeasonItem {
  return {
    malId: raw.mal_id,
    url: raw.url,
    imageUrl: raw.images?.webp?.large_image_url ?? raw.images?.jpg?.large_image_url ?? null,
    title: raw.title,
    titleEnglish: raw.title_english ?? null,
    synopsis: raw.synopsis ?? null,
    type: raw.type ?? null,
    episodes: raw.episodes ?? null,
    score: raw.score ?? null,
    scoredBy: raw.scored_by ?? null,
    members: raw.members ?? null,
    status: STATUSES[raw.status ?? ''] ?? null,
    airedFrom: raw.aired?.from ?? null,
    broadcast: toBroadcast(raw.broadcast),
    studios: names(raw.studios),
    genres: [...names(raw.genres), ...names(raw.themes)],
    isAdult: isAdultAnime(raw),
  }
}

function toBroadcast(broadcast: RawJikanAnime['broadcast']): AnimeSeasonItem['broadcast'] {
  const day = WEEKDAYS[broadcast?.day ?? '']
  const time = broadcast?.time
  return day && time ? { day, time } : null
}

function isAdultAnime(raw: RawJikanAnime): boolean {
  if (raw.rating === ADULT_RATING) return true
  return [...names(raw.genres), ...names(raw.explicit_genres)].some((genre) => ADULT_GENRES.has(genre))
}

/**
 * Maps every page's anime, keeping the first of any repeated `mal_id` (paged MAL lists can repeat one).
 * @example toAnimeSeasonItems([a, a2]).length // 1 when a2.mal_id === a.mal_id
 */
export function toAnimeSeasonItems(raw: RawJikanAnime[]): AnimeSeasonItem[] {
  const seen = new Set<number>()
  return raw.filter(({ mal_id }) => !seen.has(mal_id) && seen.add(mal_id)).map(toAnimeSeasonItem)
}
