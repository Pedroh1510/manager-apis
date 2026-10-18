import type { RawJikanAnime } from '../jikan/jikanSeasonItems.js'

/**
 * A Jikan v4 anime as the season endpoints return it (OpenAPI 4.0.0), trimmed to the fields read here.
 * @example jikanAnime({ mal_id: 2, title: 'Dandadan' })
 */
export function jikanAnime(overrides: Partial<RawJikanAnime> = {}): RawJikanAnime {
  return {
    mal_id: 52991,
    url: 'https://myanimelist.net/anime/52991/Sousou_no_Frieren',
    images: {
      webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006l.webp' },
      jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg' },
    },
    title: 'Sousou no Frieren',
    title_english: "Frieren: Beyond Journey's End",
    synopsis: 'During their decade-long quest to defeat the Demon King...',
    type: 'TV',
    episodes: 28,
    score: 9.3,
    scored_by: 120000,
    members: 450000,
    status: 'Currently Airing',
    rating: 'PG-13 - Teens 13 or older',
    aired: { from: '2026-10-04T00:00:00+00:00' },
    broadcast: { day: 'Saturdays', time: '23:00', timezone: 'Asia/Tokyo', string: 'Saturdays at 23:00 (JST)' },
    studios: [{ name: 'MAPPA' }],
    genres: [{ name: 'Action' }, { name: 'Fantasy' }],
    explicit_genres: [],
    themes: [{ name: 'Isekai' }],
    ...overrides,
  }
}

/** `count` distinct anime with ids starting at `firstId`, for paging tests. */
export function jikanAnimeRange(firstId: number, count: number): RawJikanAnime[] {
  return Array.from({ length: count }, (_, index) => jikanAnime({ mal_id: firstId + index, title: `Anime ${firstId + index}` }))
}
