// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FetchSonarrGateway, SonarrReleaseExpiredError, SonarrSeasonNotFoundError } from './sonarrGateway.js'
import { FakeSonarrApi, type FakeSonarrOptions } from '../test/FakeSonarrApi.js'
import type { RawEpisode, RawSeries } from './seriesDetail.js'

const API_KEY = 'k3y-abc'
let sonarr: FakeSonarrApi | undefined

afterEach(async () => {
  await sonarr?.close()
  sonarr = undefined
})

async function gatewayFor(options: FakeSonarrOptions, releaseTimeoutMs?: number) {
  sonarr = await FakeSonarrApi.start(options)
  return new FetchSonarrGateway({ url: sonarr.url, apiKey: API_KEY }, undefined, undefined, releaseTimeoutMs)
}

const wire: RawSeries = {
  id: 1, title: 'The Wire', sortTitle: 'wire', year: 2002, status: 'ended', network: 'HBO',
  seasons: [0, 1, 2].map((seasonNumber) => ({ seasonNumber, monitored: true })),
}
const episode = (id: number, seasonNumber: number): RawEpisode => ({ id, seasonNumber, episodeNumber: id, title: `E${id}`, hasFile: false, monitored: true })
const episodes = [episode(11, 1), episode(12, 1), episode(21, 2)]

describe('FetchSonarrGateway actions', () => {
  it('sets episodes monitored with one PUT', async () => {
    const gateway = await gatewayFor({})
    await gateway.setEpisodesMonitored([11, 12], false)

    expect(sonarr!.writes).toEqual([
      expect.objectContaining({ method: 'PUT', url: '/api/v3/episode/monitor', body: { episodeIds: [11, 12], monitored: false } }),
    ])
  })

  it('season monitor updates the season flag and its episodes', async () => {
    const gateway = await gatewayFor({ series: [wire], episodes })
    await gateway.setSeasonMonitored(1, 1, false)

    const [seriesPut, monitorPut] = sonarr!.writes
    expect(seriesPut).toMatchObject({ method: 'PUT', url: '/api/v3/series/1' })
    expect(seriesPut.body).toEqual({
      ...wire,
      seasons: [{ seasonNumber: 0, monitored: true }, { seasonNumber: 1, monitored: false }, { seasonNumber: 2, monitored: true }],
    })
    expect(monitorPut).toMatchObject({ method: 'PUT', url: '/api/v3/episode/monitor', body: { episodeIds: [11, 12], monitored: false } })
    expect(sonarr!.writes).toHaveLength(2)
  })

  it('unknown season throws without writing', async () => {
    const gateway = await gatewayFor({ series: [wire], episodes })
    await expect(gateway.setSeasonMonitored(1, 9, false)).rejects.toThrow(SonarrSeasonNotFoundError)
    await expect(gateway.setSeasonMonitored(1, 9, false)).rejects.toThrow('temporada 9 não encontrada na série 1')
    expect(sonarr!.writes).toEqual([])
  })

  it('episode search sends an EpisodeSearch command', async () => {
    const gateway = await gatewayFor({})
    await gateway.searchEpisode(11)
    expect(sonarr!.writes).toEqual([expect.objectContaining({ method: 'POST', url: '/api/v3/command', body: { name: 'EpisodeSearch', episodeIds: [11] } })])
  })

  it('season search sends a SeasonSearch command', async () => {
    const gateway = await gatewayFor({})
    await gateway.searchSeason(1, 2)
    expect(sonarr!.writes).toEqual([
      expect.objectContaining({ method: 'POST', url: '/api/v3/command', body: { name: 'SeasonSearch', seriesId: 1, seasonNumber: 2 } }),
    ])
  })

  it('lists releases with normalized fields', async () => {
    const gateway = await gatewayFor({
      releases: [
        { guid: 'g1', indexerId: 3, title: 'Show.S01E03.1080p', indexer: 'Nyaa', quality: { quality: { name: 'WEBDL-1080p' } }, size: 1610612736, seeders: 12, leechers: 3, ageHours: 30.5, approved: true, rejections: [] },
        { guid: 'g2', indexerId: 4, title: 'Show.S01E03.480p', indexer: 'Usenet', quality: { quality: { name: 'SDTV' } }, size: 1, ageHours: 100, approved: false, rejections: ['Quality not wanted'] },
      ],
    })
    const releases = await gateway.listReleases({ episodeId: 11 })

    expect(sonarr!.requests.at(-1)?.url).toBe('/api/v3/release?episodeId=11')
    expect(releases).toEqual([
      { guid: 'g1', indexerId: 3, title: 'Show.S01E03.1080p', indexer: 'Nyaa', quality: 'WEBDL-1080p', size: 1610612736, seeders: 12, leechers: 3, ageHours: 30.5, approved: true, rejections: [] },
      { guid: 'g2', indexerId: 4, title: 'Show.S01E03.480p', indexer: 'Usenet', quality: 'SDTV', size: 1, seeders: null, leechers: null, ageHours: 100, approved: false, rejections: ['Quality not wanted'] },
    ])
    await gateway.listReleases({ seriesId: 1, seasonNumber: 2 })
    expect(sonarr!.requests.at(-1)?.url).toBe('/api/v3/release?seriesId=1&seasonNumber=2')
  })

  it('release search has its own 90000ms timeout', async () => {
    const defaults = new FetchSonarrGateway({ url: 'http://127.0.0.1:1', apiKey: API_KEY })
    expect(defaults.releaseTimeoutMs).toBe(90000)
    expect(defaults.timeoutMs).toBe(10000)

    const slow = await gatewayFor({ delayMs: 200 }, 50)
    await expect(slow.listReleases({ episodeId: 11 })).rejects.toThrow(/^Sonarr indisponível em /)
  })

  it('grabs a release by guid and indexer', async () => {
    const gateway = await gatewayFor({})
    await gateway.grabRelease('g1', 3)
    expect(sonarr!.writes).toEqual([expect.objectContaining({ method: 'POST', url: '/api/v3/release', body: { guid: 'g1', indexerId: 3 } })])
  })

  it('expired release becomes a not found error', async () => {
    const gateway = await gatewayFor({ grabStatus: 404 })
    await expect(gateway.grabRelease('gone', 3)).rejects.toThrow(SonarrReleaseExpiredError)
    await expect(gateway.grabRelease('gone', 3)).rejects.toThrow('release não está mais no cache do Sonarr: refaça a busca interativa')
  })
})
