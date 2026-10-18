// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { jikanAnime } from '../test/jikanFixtures.js'
import { toAnimeSeasonItem } from './jikanSeasonItems.js'

describe('toAnimeSeasonItem', () => {
  it('maps a jikan anime to the season item shape', () => {
    expect(toAnimeSeasonItem(jikanAnime())).toEqual({
      malId: 52991,
      url: 'https://myanimelist.net/anime/52991/Sousou_no_Frieren',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/1015/138006l.webp',
      title: 'Sousou no Frieren',
      titleEnglish: "Frieren: Beyond Journey's End",
      synopsis: 'During their decade-long quest to defeat the Demon King...',
      type: 'TV',
      episodes: 28,
      score: 9.3,
      scoredBy: 120000,
      members: 450000,
      status: 'airing',
      airedFrom: '2026-10-04T00:00:00+00:00',
      broadcast: { day: 'saturday', time: '23:00' },
      studios: ['MAPPA'],
      genres: ['Action', 'Fantasy', 'Isekai'],
      isAdult: false,
    })

    const jpgOnly = jikanAnime({ images: { webp: { large_image_url: null }, jpg: { large_image_url: 'https://cdn/x.jpg' } } })
    expect(toAnimeSeasonItem(jpgOnly).imageUrl).toBe('https://cdn/x.jpg')

    expect(toAnimeSeasonItem(jikanAnime({ status: 'Not yet aired' })).status).toBe('notYetAired')
    expect(toAnimeSeasonItem(jikanAnime({ status: 'Finished Airing' })).status).toBe('finished')
    expect(toAnimeSeasonItem(jikanAnime({ status: null })).status).toBeNull()

    const sparse = toAnimeSeasonItem(jikanAnime({ title_english: null, episodes: null, score: null, synopsis: null }))
    expect([sparse.titleEnglish, sparse.episodes, sparse.score, sparse.synopsis]).toEqual([null, null, null, null])
  })

  it('maps broadcast day and time', () => {
    const days = { Mondays: 'monday', Tuesdays: 'tuesday', Wednesdays: 'wednesday', Thursdays: 'thursday', Fridays: 'friday', Saturdays: 'saturday', Sundays: 'sunday' }
    for (const [raw, day] of Object.entries(days)) {
      expect(toAnimeSeasonItem(jikanAnime({ broadcast: { day: raw, time: '23:00' } })).broadcast).toEqual({ day, time: '23:00' })
    }
    expect(toAnimeSeasonItem(jikanAnime({ broadcast: { day: null, time: '23:00' } })).broadcast).toBeNull()
    expect(toAnimeSeasonItem(jikanAnime({ broadcast: { day: 'Saturdays', time: null } })).broadcast).toBeNull()
    expect(toAnimeSeasonItem(jikanAnime({ broadcast: undefined })).broadcast).toBeNull()
  })

  it('flags adult items', () => {
    const adult = (overrides: Parameters<typeof jikanAnime>[0]) => toAnimeSeasonItem(jikanAnime(overrides)).isAdult
    expect(adult({ rating: 'Rx - Hentai' })).toBe(true)
    expect(adult({ genres: [{ name: 'Hentai' }] })).toBe(true)
    expect(adult({ genres: [{ name: 'Erotica' }] })).toBe(true)
    expect(adult({ explicit_genres: [{ name: 'Hentai' }] })).toBe(true)
    expect(adult({ explicit_genres: [{ name: 'Erotica' }] })).toBe(true)
    expect(adult({ rating: 'R+ - Mild Nudity' })).toBe(false)
    expect(adult({ rating: null })).toBe(false)
  })
})
