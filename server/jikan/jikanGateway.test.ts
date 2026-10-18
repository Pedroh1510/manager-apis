// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FakeJikanApi } from '../test/FakeJikanApi.js'
import { jikanAnime, jikanAnimeRange } from '../test/jikanFixtures.js'
import { FetchJikanGateway, JikanGatewayError, type JikanGatewayDeps } from './jikanGateway.js'

let jikan: FakeJikanApi | undefined

afterEach(async () => {
  await jikan?.close()
  jikan = undefined
})

/** Records each wait instead of waiting. */
class RecordingSleep {
  readonly waits: number[] = []
  sleep = async (ms: number) => void this.waits.push(ms)
}

/** Counts acquisitions; never makes a call wait. */
class CountingLimiter {
  acquired = 0
  acquire = async () => void this.acquired++
}

function gatewayFor(fake: FakeJikanApi, deps: Partial<JikanGatewayDeps> = {}) {
  return new FetchJikanGateway({ url: fake.url }, { limiter: new CountingLimiter(), sleep: new RecordingSleep().sleep, ...deps })
}

const pageCalls = () => jikan!.requests.map(({ path, query }) => `${path}?page=${query.page}`)

describe('FetchJikanGateway', () => {
  it('season reads every page until has_next_page is false', async () => {
    jikan = await FakeJikanApi.start({ pages: [jikanAnimeRange(1, 25), jikanAnimeRange(26, 25), jikanAnimeRange(51, 10)] })

    const list = await gatewayFor(jikan).readSeason(2026, 'fall', 'tv')

    expect(pageCalls()).toEqual(['/v4/seasons/2026/fall?page=1', '/v4/seasons/2026/fall?page=2', '/v4/seasons/2026/fall?page=3'])
    expect(list.items.map(({ malId }) => malId)).toEqual(Array.from({ length: 60 }, (_, index) => index + 1))
    expect(list.truncated).toBe(false)
  })

  it('upcoming stops at 20 pages and flags truncated', async () => {
    jikan = await FakeJikanApi.start({ pages: [jikanAnimeRange(1, 25)], endless: true })
    const capped = await gatewayFor(jikan).readUpcoming('tv')
    expect(pageCalls()).toEqual(Array.from({ length: 20 }, (_, index) => `/v4/seasons/upcoming?page=${index + 1}`))
    expect(jikan.requests.every(({ query }) => query.filter === 'tv')).toBe(true)
    expect(capped.truncated).toBe(true)
    await jikan.close()

    jikan = await FakeJikanApi.start({ pages: [jikanAnimeRange(1, 25), jikanAnimeRange(26, 5)] })
    const complete = await gatewayFor(jikan).readUpcoming('tv')
    expect(complete).toMatchObject({ truncated: false })
    expect(complete.items).toHaveLength(30)
  })

  it('query carries only filter and page', async () => {
    jikan = await FakeJikanApi.start({ pages: [[jikanAnime()]] })
    const gateway = gatewayFor(jikan)
    for (const type of ['tv', 'movie', 'ova', 'special', 'ona'] as const) await gateway.readSeason(2026, 'fall', type)
    await gateway.readUpcoming('ona')

    expect(jikan.requests.map(({ query }) => query.filter)).toEqual(['tv', 'movie', 'ova', 'special', 'ona', 'ona'])
    expect(jikan.requests.every(({ query }) => Object.keys(query).sort().join() === 'filter,page')).toBe(true)
  })

  it('duplicate mal_id keeps the first', async () => {
    jikan = await FakeJikanApi.start({
      pages: [[jikanAnime({ mal_id: 52991, title: 'Primeiro' }), jikanAnime({ mal_id: 1 })], [jikanAnime({ mal_id: 52991, title: 'Repetido' }), jikanAnime({ mal_id: 2 })]],
    })

    const { items } = await gatewayFor(jikan).readSeason(2026, 'fall', 'tv')

    expect(items.map(({ malId, title }) => [malId, title])).toEqual([[52991, 'Primeiro'], [1, 'Sousou no Frieren'], [2, 'Sousou no Frieren']])
  })

  it('retries a page on 429, 5xx, timeout and connection failure', async () => {
    jikan = await FakeJikanApi.start({ pages: [[jikanAnime()]] })
    const sleep = new RecordingSleep()
    const gateway = gatewayFor(jikan, { sleep: sleep.sleep, timeoutMs: 100 })

    jikan.script({ status: 429, headers: { 'Retry-After': '2' }, json: { status: 429 } })
    expect((await gateway.readSeason(2026, 'fall', 'tv')).items).toHaveLength(1)
    expect(sleep.waits).toEqual([2000])

    jikan.script({ status: 503, rawBody: 'down' }, { status: 503, rawBody: 'down' })
    expect((await gateway.readSeason(2026, 'fall', 'tv')).items).toHaveLength(1)
    expect(sleep.waits).toEqual([2000, 1000, 2000])

    jikan.script({ delayMs: 400, json: {} })
    expect((await gateway.readSeason(2026, 'fall', 'tv')).items).toHaveLength(1)
    expect(sleep.waits).toEqual([2000, 1000, 2000, 1000])

    let refused = false
    const refuseOnce: typeof fetch = (input, init) => {
      if (refused) return fetch(input, init)
      refused = true
      return Promise.reject(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } }))
    }
    const flaky = gatewayFor(jikan, { sleep: sleep.sleep, fetch: refuseOnce })
    expect((await flaky.readSeason(2026, 'fall', 'tv')).items).toHaveLength(1)
    expect(sleep.waits).toEqual([2000, 1000, 2000, 1000, 1000])
  })

  it('exhausted or fatal failures become gateway errors', async () => {
    jikan = await FakeJikanApi.start({ pages: [[jikanAnime()]] })
    const gateway = gatewayFor(jikan)

    jikan.script({ status: 500, rawBody: 'x' }, { status: 500, rawBody: 'x' }, { status: 500, rawBody: 'x' })
    const exhausted = await gateway.readSeason(2026, 'fall', 'tv').catch((error: unknown) => error)
    expect(exhausted).toBeInstanceOf(JikanGatewayError)
    expect((exhausted as Error).message).toContain('fall 2026')
    expect((exhausted as Error).message).toContain('HTTP 500')
    expect(jikan.requests).toHaveLength(3)

    const failures: [string, Parameters<FakeJikanApi['script']>[0]][] = [
      ['HTTP 404', { status: 404, json: { status: 404 } }],
      ['não é JSON', { rawBody: '<html>' }],
      ['sem data', { json: { pagination: { has_next_page: false } } }],
    ]
    for (const [reason, answer] of failures) {
      const before = jikan.requests.length
      jikan.script(answer)
      const error = await gateway.readUpcoming('tv').catch((caught: unknown) => caught)
      expect(error).toBeInstanceOf(JikanGatewayError)
      expect((error as Error).message).toContain('anunciados')
      expect((error as Error).message).toContain(reason)
      expect(jikan.requests.length - before).toBe(1)
    }
  })

  it('every call goes through the shared limiter', async () => {
    jikan = await FakeJikanApi.start({ pages: [jikanAnimeRange(1, 25), jikanAnimeRange(26, 1)] })
    const limiter = new CountingLimiter()
    const gateway = gatewayFor(jikan, { limiter })
    jikan.script({ status: 503, rawBody: 'down' })

    await Promise.all([gateway.readSeason(2026, 'fall', 'tv'), gateway.readSeason(2026, 'summer', 'tv')])

    expect(jikan.requests).toHaveLength(5)
    expect(limiter.acquired).toBe(5)
  })
})
