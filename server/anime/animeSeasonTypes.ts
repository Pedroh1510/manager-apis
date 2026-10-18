export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type AiringStatus = 'airing' | 'notYetAired' | 'finished'

/** One card of the season screen (door 3 of anime-season-anilist). */
export interface AnimeSeasonItem {
  /** AniList id: every item has one, unlike idMal. */
  id: number
  /** MyAnimeList page when AniList knows the MAL id, the AniList page otherwise. */
  url: string
  imageUrl: string | null
  title: string
  titleEnglish: string | null
  synopsis: string | null
  type: string | null
  episodes: number | null
  /** 0–10 with one decimal. */
  score: number | null
  /** AniList exposes no vote count; kept for the card contract. */
  scoredBy: number | null
  members: number | null
  status: AiringStatus | null
  airedFrom: string | null
  /** Day and time in JST. */
  broadcast: { day: Weekday; time: string } | null
  studios: string[]
  genres: string[]
  isAdult: boolean
}

/** What both season routes answer. */
export interface AnimeSeasonList {
  items: AnimeSeasonItem[]
  /** true when the upcoming list hit its page cap. */
  truncated: boolean
}
