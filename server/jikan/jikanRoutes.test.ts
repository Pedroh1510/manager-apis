// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { callApp } from '../test/callApp.js'
import { FakeJikanApi } from '../test/FakeJikanApi.js'
import { FakeJikanGateway } from '../test/FakeJikanGateway.js'
import { jikanAnimeRange } from '../test/jikanFixtures.js'
import { startTestApp, type TestApp } from '../test/startTestApp.js'
import { CachedJikanGateway } from './cachedJikanGateway.js'
import { FetchJikanGateway, type JikanGateway } from './jikanGateway.js'
import type { AnimeSeasonList } from './jikanSeasonItems.js'

const LIST: AnimeSeasonList = {
  items: [{
    malId: 52991, url: 'https://myanimelist.net/anime/52991', imageUrl: null, title: 'Sousou no Frieren', titleEnglish: null, synopsis: null,
    type: 'TV', episodes: 28, score: 9.3, scoredBy: 1, members: 2, status: 'airing', airedFrom: null, broadcast: null, studios: [], genres: [], isAdult: false,
  }],
  truncated: false,
}

let app: TestApp | undefined
let jikan: FakeJikanApi | undefined

afterEach(async () => {
  vi.useRealTimers()
  await app?.close()
  await jikan?.close()
  app = undefined
  jikan = undefined
})

async function startWith(gateway: JikanGateway): Promise<TestApp> {
  app = await startTestApp({ jikan: gateway })
  return app
}

const noWait = { limiter: { acquire: async () => undefined }, sleep: async () => undefined }

describe('anime season routes', () => {
  it('season answers 200 with the gateway result', async () => {
    const gateway = new FakeJikanGateway({ list: LIST })
    const res = await callApp(await startWith(gateway), 'GET', '/api/anime/seasons/2026/fall?type=tv')

    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual(LIST)
    expect(gateway.calls).toEqual([{ method: 'readSeason', year: 2026, season: 'fall', type: 'tv' }])
  })

  it('upcoming answers 200 with the gateway result', async () => {
    const gateway = new FakeJikanGateway({ list: { ...LIST, truncated: true } })
    const res = await callApp(await startWith(gateway), 'GET', '/api/anime/seasons/upcoming?type=tv')

    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ...LIST, truncated: true })
    expect(gateway.calls).toEqual([{ method: 'readUpcoming', type: 'tv' }])
  })

  it('type defaults to tv and passes the five accepted values', async () => {
    const gateway = new FakeJikanGateway({ list: LIST })
    const started = await startWith(gateway)
    await callApp(started, 'GET', '/api/anime/seasons/2026/fall')
    for (const type of ['movie', 'ova', 'special', 'ona']) await callApp(started, 'GET', `/api/anime/seasons/2026/fall?type=${type}`)
    await callApp(started, 'GET', '/api/anime/seasons/upcoming')

    expect(gateway.calls.map(({ type }) => type)).toEqual(['tv', 'movie', 'ova', 'special', 'ona', 'tv'])
  })

  it('invalid input answers 400 without calling jikan', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-18T12:00:00Z'))
    const gateway = new FakeJikanGateway({ list: LIST })
    const started = await startWith(gateway)
    const rejected: [string, string][] = [
      ['/api/anime/seasons/1916/fall', 'year inválido: "1916", esperado inteiro entre 1917 e 2027'],
      ['/api/anime/seasons/2028/fall', 'year inválido: "2028", esperado inteiro entre 1917 e 2027'],
      ['/api/anime/seasons/abc/fall', 'year inválido: "abc", esperado inteiro entre 1917 e 2027'],
      ['/api/anime/seasons/2026.5/fall', 'year inválido: "2026.5", esperado inteiro entre 1917 e 2027'],
      ['/api/anime/seasons/2026/autumn', 'season inválido: "autumn", esperado winter|spring|summer|fall'],
      ['/api/anime/seasons/2026/fall?type=music', 'type inválido: "music", esperado tv|movie|ova|special|ona'],
      ['/api/anime/seasons/upcoming?type=music', 'type inválido: "music", esperado tv|movie|ova|special|ona'],
    ]
    for (const [path, error] of rejected) {
      expect(await callApp(started, 'GET', path)).toEqual({ status: 400, body: JSON.stringify({ error }) })
    }
    expect(gateway.calls).toEqual([])

    expect((await callApp(started, 'GET', '/api/anime/seasons/1917/winter')).status).toBe(200)
    expect((await callApp(started, 'GET', '/api/anime/seasons/2027/fall')).status).toBe(200)
  })

  it('gateway error answers 502, is logged and is not cached', async () => {
    const inner = new FakeJikanGateway({ failWith: 'Jikan falhou em fall 2026, página 1: HTTP 500 após 3 tentativas' })
    const started = await startWith(new CachedJikanGateway(inner))

    const res = await callApp(started, 'GET', '/api/anime/seasons/2026/fall')
    expect(res).toEqual({ status: 502, body: JSON.stringify({ error: 'Jikan falhou em fall 2026, página 1: HTTP 500 após 3 tentativas' }) })
    const logged = started.logLines.map((line) => JSON.parse(line)).find(({ msg }) => msg === 'jikan request failed')
    expect(logged).toMatchObject({ path: '/api/anime/seasons/2026/fall', reason: 'Jikan falhou em fall 2026, página 1: HTTP 500 após 3 tentativas' })

    inner.data.failWith = undefined
    expect((await callApp(started, 'GET', '/api/anime/seasons/2026/fall')).status).toBe(200)
    expect(inner.calls).toHaveLength(2)
  })

  it('second request is served from cache', async () => {
    jikan = await FakeJikanApi.start({ pages: [jikanAnimeRange(1, 25), jikanAnimeRange(26, 3)] })
    const started = await startWith(new CachedJikanGateway(new FetchJikanGateway({ url: jikan.url }, noWait)))

    const first = await callApp(started, 'GET', '/api/anime/seasons/2026/fall')
    const second = await callApp(started, 'GET', '/api/anime/seasons/2026/fall')

    expect(first.status).toBe(200)
    expect(JSON.parse(first.body).items).toHaveLength(28)
    expect(second).toEqual(first)
    expect(jikan.requests).toHaveLength(2)
  })
})
