import type { RawAniListMedia } from '../anime/anilistMedia.js'

/**
 * An AniList media as the season query returns it (checked on graphql.anilist.co, 2026-10-18).
 * @example anilistMedia({ id: 2, title: { romaji: 'Dandadan', english: null } })
 */
export function anilistMedia(overrides: Partial<RawAniListMedia> = {}): RawAniListMedia {
  return {
    id: 195516,
    idMal: 61987,
    siteUrl: 'https://anilist.co/anime/195516',
    title: { romaji: 'Kusuriya no Hitorigoto 3rd Season', english: 'The Apothecary Diaries Season 3' },
    description: 'In the aftermath of the Shi Clan’s rebellion, things have finally settled down.',
    format: 'TV',
    episodes: 12,
    averageScore: 85,
    popularity: 100579,
    status: 'RELEASING',
    isAdult: false,
    startDate: { year: 2026, month: 10, day: 2 },
    airingSchedule: { nodes: [{ airingAt: 1790949600 }] },
    studios: { nodes: [{ name: 'OLM' }] },
    genres: ['Drama', 'Mystery'],
    coverImage: { large: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx195516.jpg', extraLarge: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx195516.jpg' },
    ...overrides,
  }
}

/** `count` distinct media with ids starting at `firstId`, for paging tests. */
export function anilistMediaRange(firstId: number, count: number): RawAniListMedia[] {
  return Array.from({ length: count }, (_, index) => anilistMedia({ id: firstId + index, title: { romaji: `Anime ${firstId + index}`, english: null } }))
}
