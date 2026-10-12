// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { toCalendarItems, type RawCalendarEpisode } from './calendarEpisodes.js'

const NOW = new Date('2026-10-14T12:00:00Z')

function episode(overrides: Partial<RawCalendarEpisode>): RawCalendarEpisode {
  return {
    id: 1, seriesId: 7, seasonNumber: 1, episodeNumber: 1, title: 'Pilot',
    airDateUtc: '2026-10-12T01:00:00Z', hasFile: false, monitored: true, series: { title: 'The Wire' },
    ...overrides,
  }
}

describe('toCalendarItems', () => {
  it('status follows downloaded, unmonitored, unaired, missing precedence', () => {
    const cases: [Partial<RawCalendarEpisode>, string][] = [
      [{ hasFile: true, monitored: false }, 'downloaded'],
      [{ hasFile: false, monitored: false, airDateUtc: '2026-10-10T00:00:00Z' }, 'unmonitored'],
      [{ hasFile: false, monitored: true, airDateUtc: '2026-10-14T12:00:01Z' }, 'unaired'],
      [{ hasFile: false, monitored: true, airDateUtc: '2026-10-14T12:00:00Z' }, 'missing'],
    ]
    for (const [input, status] of cases) {
      expect(toCalendarItems([episode(input)], NOW)[0].status, JSON.stringify(input)).toBe(status)
    }
  })

  it('maps each episode to the flat calendar item', () => {
    expect(toCalendarItems([episode({ id: 27 }), episode({ id: 28, series: undefined })], NOW)).toEqual([
      { episodeId: 27, seriesId: 7, seriesTitle: 'The Wire', seasonNumber: 1, episodeNumber: 1, title: 'Pilot', airDateUtc: '2026-10-12T01:00:00Z', status: 'missing' },
      { episodeId: 28, seriesId: 7, seriesTitle: '', seasonNumber: 1, episodeNumber: 1, title: 'Pilot', airDateUtc: '2026-10-12T01:00:00Z', status: 'missing' },
    ])
  })

  it('drops episodes without an air date', () => {
    const items = toCalendarItems([episode({ id: 1 }), episode({ id: 2, airDateUtc: undefined }), episode({ id: 3 })], NOW)
    expect(items.map((item) => item.episodeId)).toEqual([1, 3])
  })
})
