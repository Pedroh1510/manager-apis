// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FetchSonarrGateway, SonarrGatewayError, SonarrNotFoundError } from './sonarrGateway.js'
import { FakeSonarrApi, type FakeSonarrOptions } from '../test/FakeSonarrApi.js'
import type { RawSeries } from './seriesDetail.js'

const API_KEY = 'k3y-abc'
let sonarr: FakeSonarrApi | undefined

afterEach(async () => {
  await sonarr?.close()
  sonarr = undefined
})

async function gatewayFor(options: FakeSonarrOptions, timeoutMs?: number) {
  sonarr = await FakeSonarrApi.start(options)
  return new FetchSonarrGateway({ url: sonarr.url, apiKey: API_KEY }, timeoutMs, () => new Date('2026-10-10T12:00:00Z'))
}

function series(overrides: Partial<RawSeries>): RawSeries {
  return {
    id: 1, title: 'The Wire', sortTitle: 'wire', year: 2002, status: 'ended', network: 'HBO',
    statistics: { episodeFileCount: 60, episodeCount: 60, sizeOnDisk: 1 }, seasons: [{ seasonNumber: 1 }], ...overrides,
  }
}

describe('FetchSonarrGateway', () => {
  it('sends the api key only in the X-Api-Key header', async () => {
    const gateway = await gatewayFor({ series: [series({})], episodes: [], posters: { 1: Buffer.from('jpg') } })
    await gateway.readStatus()
    await gateway.listSeries()
    await gateway.getSeriesDetail(1)
    await gateway.getPoster(1)

    expect(sonarr!.requests.length).toBeGreaterThanOrEqual(8)
    for (const request of sonarr!.requests) {
      expect(request.apiKey).toBe(API_KEY)
      expect(request.url).not.toContain(API_KEY)
    }
  })

  it('status reads version, health, queue and root folders', async () => {
    const gateway = await gatewayFor({
      health: [{ type: 'warning', message: 'Indexer X indisponível', source: 'IndexerCheck' }, { type: 'error', message: 'Pasta raiz /tv ausente' }],
      queueTotal: 7,
      rootFolders: [{ path: '/tv', freeSpace: 412316860416 }, { path: '/anime', freeSpace: 1610612736 }],
    })

    expect(await gateway.readStatus()).toEqual({
      version: '4.0.9.2244',
      health: [{ type: 'warning', message: 'Indexer X indisponível' }, { type: 'error', message: 'Pasta raiz /tv ausente' }],
      queueCount: 7,
      rootFolders: [{ path: '/tv', freeSpace: 412316860416 }, { path: '/anime', freeSpace: 1610612736 }],
    })
  })

  it('lists series sorted by sortTitle with alternate titles', async () => {
    const gateway = await gatewayFor({
      series: [
        series({ id: 1, title: 'The Wire', sortTitle: 'wire' }),
        series({ id: 2, title: 'Ação Total', sortTitle: 'acao total', alternateTitles: [{ title: 'Action Total' }] }),
        series({ id: 3, title: 'Zorro', sortTitle: 'zorro', alternateTitles: undefined }),
      ],
    })
    const list = await gateway.listSeries()

    expect(list.map((item) => item.title)).toEqual(['Ação Total', 'The Wire', 'Zorro'])
    expect(list[0].alternateTitles).toEqual(['Action Total'])
    expect(list[2].alternateTitles).toEqual([])
    expect(Object.keys(list[1]).sort()).toEqual(
      ['alternateTitles', 'episodeCount', 'episodeFileCount', 'id', 'network', 'status', 'title', 'year'],
    )
  })

  it('series detail joins the series and its episodes', async () => {
    const gateway = await gatewayFor({
      series: [series({ seasons: [{ seasonNumber: 1, statistics: { episodeFileCount: 1, episodeCount: 1 } }] })],
      episodes: [{ id: 10, seasonNumber: 1, episodeNumber: 1, title: 'The Target', airDateUtc: '2002-06-03T01:00:00Z', hasFile: true, monitored: true }],
    })
    const detail = await gateway.getSeriesDetail(1)

    expect(detail.title).toBe('The Wire')
    expect(detail.seasons[0].episodes).toEqual([
      { id: 10, episodeNumber: 1, title: 'The Target', airDateUtc: '2002-06-03T01:00:00Z', state: 'downloaded', monitored: true },
    ])
  })

  it('poster reads poster-500 from mediacover', async () => {
    const gateway = await gatewayFor({ posters: { 1: Buffer.from('jpeg-bytes') } })
    const poster = await gateway.getPoster(1)

    expect(sonarr!.requests.at(-1)?.url).toBe('/api/v3/mediacover/1/poster-500.jpg')
    expect(poster.contentType).toBe('image/jpeg')
    expect(Buffer.from(poster.bytes).toString()).toBe('jpeg-bytes')
  })

  it('404 from sonarr becomes not found', async () => {
    const gateway = await gatewayFor({ series: [] })
    await expect(gateway.getSeriesDetail(999)).rejects.toBeInstanceOf(SonarrNotFoundError)
    await expect(gateway.getPoster(999)).rejects.toBeInstanceOf(SonarrNotFoundError)
  })

  it('default timeout is 10000ms', () => {
    const gateway = new FetchSonarrGateway({ url: 'http://127.0.0.1:1', apiKey: API_KEY })
    expect(gateway.timeoutMs).toBe(10000)
  })

  it('timeout, refused connection and 5xx become unavailable errors', async () => {
    const slow = await gatewayFor({ delayMs: 200 }, 50)
    const url = sonarr!.url
    await expect(slow.readStatus()).rejects.toThrow(`Sonarr indisponível em ${url}:`)
    await sonarr!.close()
    sonarr = undefined

    const refused = new FetchSonarrGateway({ url, apiKey: API_KEY }, 50)
    await expect(refused.listSeries()).rejects.toThrow(`Sonarr indisponível em ${url}:`)

    const broken = await gatewayFor({ failStatus: 500 })
    await expect(broken.listSeries()).rejects.toThrow(`Sonarr indisponível em ${sonarr!.url}:`)
    await expect(broken.getSeriesDetail(1)).rejects.toBeInstanceOf(SonarrGatewayError)
  })

  it('401 becomes a rejected api key error', async () => {
    const gateway = await gatewayFor({ failStatus: 401 })
    await expect(gateway.readStatus()).rejects.toThrow('Sonarr recusou a API key (SONARR_API_KEY)')
  })
})
