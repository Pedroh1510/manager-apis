// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { anilistMedia } from '../test/anilistFixtures.js'
import { toAnimeSeasonItem } from './anilistMedia.js'

const DAY_S = 24 * 60 * 60
// 2026-10-02 23:00 JST, a Friday.
const FRIDAY_2300_JST = 1790949600

describe('toAnimeSeasonItem', () => {
  it('maps an anilist media to the season item shape', () => {
    expect(toAnimeSeasonItem(anilistMedia())).toEqual({
      id: 195516,
      url: 'https://myanimelist.net/anime/61987',
      imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx195516.jpg',
      title: 'Kusuriya no Hitorigoto 3rd Season',
      titleEnglish: 'The Apothecary Diaries Season 3',
      synopsis: 'In the aftermath of the Shi Clan’s rebellion, things have finally settled down.',
      type: 'TV',
      episodes: 12,
      score: 8.5,
      scoredBy: null,
      members: 100579,
      status: 'airing',
      airedFrom: '2026-10-02T00:00:00.000Z',
      broadcast: { day: 'friday', time: '23:00' },
      studios: ['OLM'],
      genres: ['Drama', 'Mystery'],
      isAdult: false,
    })

    expect(toAnimeSeasonItem(anilistMedia({ idMal: null })).url).toBe('https://anilist.co/anime/195516')
    expect(toAnimeSeasonItem(anilistMedia({ coverImage: { large: 'https://cdn/l.jpg', extraLarge: null } })).imageUrl).toBe('https://cdn/l.jpg')
    expect(toAnimeSeasonItem(anilistMedia({ averageScore: null })).score).toBeNull()
    expect(toAnimeSeasonItem(anilistMedia({ isAdult: true })).isAdult).toBe(true)
  })

  it('maps anilist status', () => {
    const status = (value: string | null) => toAnimeSeasonItem(anilistMedia({ status: value })).status
    expect(status('RELEASING')).toBe('airing')
    expect(status('NOT_YET_RELEASED')).toBe('notYetAired')
    expect(status('FINISHED')).toBe('finished')
    expect(status('CANCELLED')).toBeNull()
    expect(status('HIATUS')).toBeNull()
    expect(status(null)).toBeNull()
  })

  it('first episode becomes the jst weekday and time', () => {
    const at = (airingAt: number) => toAnimeSeasonItem(anilistMedia({ airingSchedule: { nodes: [{ airingAt }] } })).broadcast
    expect(at(FRIDAY_2300_JST)).toEqual({ day: 'friday', time: '23:00' })
    const week = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    week.forEach((day, offset) => expect(at(FRIDAY_2300_JST + (offset + 1) * DAY_S)).toEqual({ day, time: '23:00' }))
    expect(at(FRIDAY_2300_JST + 90 * 60)).toEqual({ day: 'saturday', time: '00:30' })
    expect(toAnimeSeasonItem(anilistMedia({ airingSchedule: { nodes: [] } })).broadcast).toBeNull()
  })

  it('start date becomes an iso date only when complete', () => {
    const date = (startDate: { year: number | null; month: number | null; day: number | null }) => toAnimeSeasonItem(anilistMedia({ startDate })).airedFrom
    expect(date({ year: 2026, month: 10, day: 2 })).toBe('2026-10-02T00:00:00.000Z')
    expect(date({ year: 2027, month: 1, day: null })).toBeNull()
    expect(date({ year: 2027, month: null, day: null })).toBeNull()
    expect(date({ year: null, month: 1, day: 9 })).toBeNull()
  })

  it('description loses html tags and entities', () => {
    const description = 'A &amp; B said &quot;hi&quot; &#039;ok&#039; &lt;3 &gt;\n<br><br>\n<i>Second</i> line<br>'
    expect(toAnimeSeasonItem(anilistMedia({ description })).synopsis).toBe('A & B said "hi" \'ok\' <3 >\n\nSecond line')
    expect(toAnimeSeasonItem(anilistMedia({ description: null })).synopsis).toBeNull()
    const nested = toAnimeSeasonItem(anilistMedia({ description: '<scr<script>ipt>alert(1)</script> <<b>i>x' })).synopsis
    expect(nested).not.toMatch(/<[a-z/]/i)
  })
})
