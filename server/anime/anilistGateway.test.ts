// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'
import { FakeAniListApi } from '../test/FakeAniListApi.js'
import { anilistMedia, anilistMediaRange } from '../test/anilistFixtures.js'
import { AnimeSeasonGatewayError, GraphqlAniListGateway, SEASON_QUERY, type AniListGatewayDeps } from './anilistGateway.js'

let anilist: FakeAniListApi | undefined

afterEach(async () => {
  await anilist?.close()
  anilist = undefined
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

function gatewayFor(fake: FakeAniListApi, deps: Partial<AniListGatewayDeps> = {}) {
  return new GraphqlAniListGateway({ url: fake.url }, { limiter: new CountingLimiter(), sleep: new RecordingSleep().sleep, ...deps })
}

const sentVariables = () => anilist!.requests.map(({ variables }) => variables)

describe('GraphqlAniListGateway', () => {
  it('season posts one page at a time until hasNextPage is false', async () => {
    anilist = await FakeAniListApi.start({ pages: [anilistMediaRange(1, 50), anilistMediaRange(51, 50), anilistMediaRange(101, 10)] })

    const list = await gatewayFor(anilist).readSeason(2026, 'fall', 'tv')

    expect(anilist.requests.map(({ method, path, query }) => [method, path, query])).toEqual(Array(3).fill(['POST', '/', SEASON_QUERY]))
    expect(sentVariables()).toEqual([1, 2, 3].map((page) => ({ season: 'FALL', seasonYear: 2026, formats: ['TV', 'TV_SHORT'], page })))
    expect(list.items.map(({ id }) => id)).toEqual(Array.from({ length: 110 }, (_, index) => index + 1))
    expect(list.truncated).toBe(false)
  })

  it('upcoming stops at 10 pages and flags truncated', async () => {
    anilist = await FakeAniListApi.start({ pages: [anilistMediaRange(1, 50)], endless: true })
    const capped = await gatewayFor(anilist).readUpcoming('tv')
    expect(sentVariables()).toEqual(Array.from({ length: 10 }, (_, index) => ({ status: 'NOT_YET_RELEASED', formats: ['TV', 'TV_SHORT'], page: index + 1 })))
    expect(sentVariables().every((variables) => !('season' in variables) && !('seasonYear' in variables))).toBe(true)
    expect(capped.truncated).toBe(true)
    await anilist.close()

    anilist = await FakeAniListApi.start({ pages: [anilistMediaRange(1, 50), anilistMediaRange(51, 5)] })
    const complete = await gatewayFor(anilist).readUpcoming('tv')
    expect(complete.truncated).toBe(false)
    expect(complete.items).toHaveLength(55)
  })

  it('maps type to formats and season to the anilist enum', async () => {
    anilist = await FakeAniListApi.start({ pages: [[anilistMedia()]] })
    const gateway = gatewayFor(anilist)
    for (const type of ['tv', 'movie', 'ova', 'special', 'ona'] as const) await gateway.readSeason(2026, 'fall', type)
    for (const season of ['winter', 'spring', 'summer', 'fall'] as const) await gateway.readSeason(2026, season, 'tv')

    const formats = sentVariables().slice(0, 5).map(({ formats: sent }) => sent)
    expect(formats).toEqual([['TV', 'TV_SHORT'], ['MOVIE'], ['OVA'], ['SPECIAL'], ['ONA']])
    expect(sentVariables().slice(5).map(({ season }) => season)).toEqual(['WINTER', 'SPRING', 'SUMMER', 'FALL'])
  })

  it('duplicate id keeps the first', async () => {
    anilist = await FakeAniListApi.start({
      pages: [
        [anilistMedia({ id: 195516, title: { romaji: 'Primeiro' } }), anilistMedia({ id: 1 })],
        [anilistMedia({ id: 195516, title: { romaji: 'Repetido' } }), anilistMedia({ id: 2 })],
      ],
    })

    const { items } = await gatewayFor(anilist).readSeason(2026, 'fall', 'tv')

    expect(items.map(({ id, title }) => [id, title])).toEqual([[195516, 'Primeiro'], [1, 'Kusuriya no Hitorigoto 3rd Season'], [2, 'Kusuriya no Hitorigoto 3rd Season']])
  })

  it('retries a page on 429, 5xx, timeout and connection failure', async () => {
    anilist = await FakeAniListApi.start({ pages: [[anilistMedia()]] })
    const sleep = new RecordingSleep()
    const gateway = gatewayFor(anilist, { sleep: sleep.sleep, timeoutMs: 100 })

    anilist.script({ status: 429, headers: { 'Retry-After': '2' }, json: { errors: [{ message: 'Too Many Requests.' }] } })
    expect((await gateway.readSeason(2026, 'fall', 'tv')).items).toHaveLength(1)
    expect(sleep.waits).toEqual([2000])

    anilist.script({ status: 503, rawBody: 'down' }, { status: 503, rawBody: 'down' })
    expect((await gateway.readSeason(2026, 'fall', 'tv')).items).toHaveLength(1)
    expect(sleep.waits).toEqual([2000, 1000, 2000])

    anilist.script({ delayMs: 400, json: {} })
    expect((await gateway.readSeason(2026, 'fall', 'tv')).items).toHaveLength(1)
    expect(sleep.waits).toEqual([2000, 1000, 2000, 1000])

    let refused = false
    const refuseOnce: typeof fetch = (input, init) => {
      if (refused) return fetch(input, init)
      refused = true
      return Promise.reject(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } }))
    }
    expect((await gatewayFor(anilist, { sleep: sleep.sleep, fetch: refuseOnce }).readSeason(2026, 'fall', 'tv')).items).toHaveLength(1)
    expect(sleep.waits).toEqual([2000, 1000, 2000, 1000, 1000])
  })

  it('exhausted or fatal failures become gateway errors', async () => {
    anilist = await FakeAniListApi.start({ pages: [[anilistMedia()]] })
    const gateway = gatewayFor(anilist)

    anilist.script({ status: 500, rawBody: 'x' }, { status: 500, rawBody: 'x' }, { status: 500, rawBody: 'x' })
    const exhausted = await gateway.readSeason(2026, 'fall', 'tv').catch((error: unknown) => error)
    expect(exhausted).toBeInstanceOf(AnimeSeasonGatewayError)
    expect((exhausted as Error).message).toBe('AniList falhou em fall 2026, página 1: HTTP 500 após 3 tentativas')
    expect(anilist.requests).toHaveLength(3)

    const failures: [string, Parameters<FakeAniListApi['script']>[0]][] = [
      ['HTTP 400', { status: 400, json: { errors: [{ message: 'Bad' }] } }],
      ['Invalid token', { json: { errors: [{ message: 'Invalid token' }], data: null } }],
      ['resposta não é JSON', { rawBody: '<html>' }],
      ['resposta sem data.Page', { json: { data: {} } }],
    ]
    for (const [reason, answer] of failures) {
      const before = anilist.requests.length
      anilist.script(answer)
      const error = await gateway.readUpcoming('tv').catch((caught: unknown) => caught)
      expect(error).toBeInstanceOf(AnimeSeasonGatewayError)
      expect((error as Error).message).toBe(`AniList falhou em anunciados, página 1: ${reason}`)
      expect(anilist.requests.length - before).toBe(1)
    }
  })

  it('every call goes through the shared limiter', async () => {
    anilist = await FakeAniListApi.start({ pages: [anilistMediaRange(1, 50), anilistMediaRange(51, 1)] })
    const limiter = new CountingLimiter()
    const gateway = gatewayFor(anilist, { limiter })
    anilist.script({ status: 503, rawBody: 'down' })

    await Promise.all([gateway.readSeason(2026, 'fall', 'tv'), gateway.readSeason(2026, 'summer', 'tv')])

    expect(anilist.requests).toHaveLength(5)
    expect(limiter.acquired).toBe(5)
  })

  it('no jikan references remain in the code', () => {
    // git grep exits 1 when nothing matches; .specs lives outside this repo.
    const hits = (() => {
      try {
        return execFileSync('git', ['grep', '-i', '-l', ['ji', 'kan'].join(''), '--', 'server', 'src'], { encoding: 'utf8' })
      } catch {
        return ''
      }
    })()
    expect(hits.split('\n').filter((file) => file && !file.endsWith('anilistGateway.test.ts'))).toEqual([])
  })
})
