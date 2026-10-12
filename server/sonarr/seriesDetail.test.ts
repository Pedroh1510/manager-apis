// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildSeriesDetail, deriveEpisodeState, type RawEpisode, type RawSeries } from './seriesDetail.js'

const NOW = new Date('2026-10-10T12:00:00Z')

function episode(overrides: Partial<RawEpisode>): RawEpisode {
  return { id: 1, seasonNumber: 1, episodeNumber: 1, title: 'Ep', airDateUtc: '2020-01-01T00:00:00Z', hasFile: false, monitored: true, ...overrides }
}

const series: RawSeries = {
  id: 1, title: 'The Wire', sortTitle: 'wire', year: 2002, status: 'ended', network: 'HBO', overview: 'Baltimore.',
  statistics: { episodeFileCount: 4, episodeCount: 5, sizeOnDisk: 100 },
  seasons: [0, 1, 3, 2].map((seasonNumber) => ({ seasonNumber, monitored: seasonNumber !== 0, statistics: { episodeFileCount: 1, episodeCount: 2 } })),
}

describe('deriveEpisodeState', () => {
  it('derives the episode state from file and air date', () => {
    const table: [Partial<RawEpisode>, string][] = [
      [{ hasFile: true, airDateUtc: '2020-01-01T00:00:00Z' }, 'downloaded'],
      [{ hasFile: true, airDateUtc: '2027-01-01T00:00:00Z' }, 'downloaded'],
      [{ hasFile: false, airDateUtc: undefined }, 'tba'],
      [{ hasFile: false, airDateUtc: '2026-10-11T00:00:00Z' }, 'unaired'],
      [{ hasFile: false, airDateUtc: '2026-10-10T11:59:59Z' }, 'missing'],
    ]
    for (const [input, state] of table) {
      expect(deriveEpisodeState(episode(input), NOW), JSON.stringify(input)).toBe(state)
    }
  })
})

describe('buildSeriesDetail', () => {
  it('orders seasons newest first with specials last and episodes ascending', () => {
    const episodes = [3, 1, 2].map((n) => episode({ id: n, seasonNumber: 1, episodeNumber: n }))
    const detail = buildSeriesDetail(series, episodes, NOW)

    expect(detail.seasons.map((s) => s.seasonNumber)).toEqual([3, 2, 1, 0])
    const seasonOne = detail.seasons.find((s) => s.seasonNumber === 1)!
    expect(seasonOne.episodes.map((e) => e.episodeNumber)).toEqual([1, 2, 3])
  })

  it('maps the header and each episode with its state', () => {
    const detail = buildSeriesDetail(series, [episode({ id: 9, seasonNumber: 2, episodeNumber: 4, title: 'Final', hasFile: true })], NOW)

    expect(detail).toMatchObject({
      id: 1, title: 'The Wire', year: 2002, status: 'ended', network: 'HBO', overview: 'Baltimore.',
      sizeOnDisk: 100, episodeFileCount: 4, episodeCount: 5,
    })
    expect(detail.seasons.find((s) => s.seasonNumber === 2)).toEqual({
      seasonNumber: 2, monitored: true, episodeFileCount: 1, episodeCount: 2,
      episodes: [{ id: 9, episodeNumber: 4, title: 'Final', airDateUtc: '2020-01-01T00:00:00Z', state: 'downloaded', monitored: true }],
    })
    expect(detail.seasons.find((s) => s.seasonNumber === 0)?.monitored).toBe(false)
  })
})

describe('buildSeriesDetail alternate titles', () => {
  const withTitles = (title: string, alternateTitles: RawSeries['alternateTitles']) => buildSeriesDetail({ ...series, title, alternateTitles }, [], NOW).alternateTitles

  it('alternate titles group by normalized name keeping first spelling', () => {
    expect(withTitles('Attack on Titan Final', [
      { title: 'Shingeki no Kyojin', seasonNumber: 1 },
      { title: 'Attack on Titan' },
      { title: 'shingeki no kyojin', seasonNumber: 3 },
      { title: 'Shingeki no Kyojín', seasonNumber: 2 },
    ])).toEqual([
      { title: 'Shingeki no Kyojin', seasonNumbers: [1, 2, 3] },
      { title: 'Attack on Titan', seasonNumbers: [] },
    ])
  })

  it('alternate titles exclude the main title', () => {
    expect(withTitles('Ataque dos Titãs', [{ title: 'ataque dos titas', seasonNumber: -1 }, { title: 'AoT', seasonNumber: -1 }]))
      .toEqual([{ title: 'AoT', seasonNumbers: [] }])
  })

  it('season numbers sort, dedupe and collapse to whole series', () => {
    const seasonsOf = (entries: { seasonNumber?: number }[]) => withTitles('X', entries.map((entry) => ({ title: 'Y', ...entry })))[0].seasonNumbers
    expect(seasonsOf([{ seasonNumber: 3 }, { seasonNumber: 1 }, { seasonNumber: 3 }])).toEqual([1, 3])
    expect(seasonsOf([{ seasonNumber: 1 }, { seasonNumber: -1 }])).toEqual([])
    expect(seasonsOf([{ seasonNumber: 2 }, {}])).toEqual([])
  })

  it('no alternate titles from sonarr gives an empty list', () => {
    expect(withTitles('The Wire', undefined)).toEqual([])
  })
})

