// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { callApp } from '../test/callApp.js'
import { FakeSonarrGateway, type FakeSonarrData } from '../test/FakeSonarrGateway.js'
import { startTestApp, type TestApp } from '../test/startTestApp.js'
import { SonarrLookupNotFoundError, SonarrRejectedError, SonarrSeriesExistsError } from './sonarrGateway.js'
import type { AddSeriesInput, SeriesLookupResult } from './seriesLookup.js'

let app: TestApp | undefined

afterEach(async () => {
  await app?.close()
  app = undefined
})

function call(method: string, path: string, body?: unknown) {
  return callApp(app!, method, path, body)
}

async function withSonarr(data: FakeSonarrData = {}): Promise<FakeSonarrGateway> {
  const gateway = new FakeSonarrGateway(data)
  app = await startTestApp({ sonarr: gateway })
  return gateway
}

const addBody: AddSeriesInput = {
  tvdbId: 371980, qualityProfileId: 4, rootFolderPath: '/tv', seriesType: 'anime', monitor: 'lastSeason', searchForMissingEpisodes: false,
}
const severance: SeriesLookupResult = {
  tvdbId: 371980, title: 'Severance', year: 2022, network: null, overview: null, genres: [], remotePoster: null, seriesId: null,
}

const NEW_ROUTES: [string, string, unknown?][] = [
  ['GET', '/api/sonarr/lookup?term=x'],
  ['GET', '/api/sonarr/add-options'],
  ['POST', '/api/sonarr/series', addBody],
  ['GET', '/api/sonarr/missing'],
  ['POST', '/api/sonarr/episodes/search', { episodeIds: [60] }],
  ['POST', '/api/sonarr/missing/search'],
]

function expectInvalidBody(res: { status: number; body: string }, body: unknown): void {
  expect(res.status, JSON.stringify(body)).toBe(400)
  const { error } = JSON.parse(res.body)
  expect(error.startsWith('corpo inválido:')).toBe(true)
  expect(error).toContain(JSON.stringify(body))
}

describe('sonarr library routes', () => {
  it('lookup answers 200 with the gateway results', async () => {
    const gateway = await withSonarr({ lookup: [severance] })
    const res = await call('GET', '/api/sonarr/lookup?term=the%20wire')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual([severance])
    expect(gateway.calls).toEqual(['lookupSeries:the wire'])
  })

  it('blank lookup term returns 400 without calling sonarr', async () => {
    const gateway = await withSonarr()
    for (const [query, received] of [['', ''], ['?term=', ''], ['?term=%20%20', '  ']]) {
      const res = await call('GET', `/api/sonarr/lookup${query}`)
      expect(res.status, query).toBe(400)
      expect(JSON.parse(res.body)).toEqual({ error: `termo de busca vazio: recebido "${received}"` })
    }
    expect(gateway.calls).toEqual([])
  })

  it('add options answers 200', async () => {
    const options = { qualityProfiles: [{ id: 1, name: 'Any' }], rootFolders: [{ path: '/tv', freeSpace: 10 }] }
    await withSonarr({ addOptions: options })
    const res = await call('GET', '/api/sonarr/add-options')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual(options)
  })

  it('add series answers 201 with the new id', async () => {
    const gateway = await withSonarr({ addedSeriesId: 7 })
    const res = await call('POST', '/api/sonarr/series', addBody)
    expect(res.status).toBe(201)
    expect(JSON.parse(res.body)).toEqual({ id: 7 })
    expect(gateway.calls).toEqual([`addSeries:${JSON.stringify(addBody)}`])
  })

  it('invalid add bodies return 400 without calling sonarr', async () => {
    const gateway = await withSonarr()
    const invalid = [
      {}, { ...addBody, tvdbId: 0 }, { ...addBody, qualityProfileId: 'a' }, { ...addBody, rootFolderPath: '' },
      { ...addBody, seriesType: 'movie' }, { ...addBody, monitor: 'pilot' }, { ...addBody, searchForMissingEpisodes: 'sim' },
    ]
    for (const body of invalid) expectInvalidBody(await call('POST', '/api/sonarr/series', body), body)
    expect(gateway.calls).toEqual([])
  })

  it('add series maps missing, duplicate and rejected to 404, 409 and 422', async () => {
    const cases: [Error, number][] = [
      [new SonarrLookupNotFoundError(999), 404],
      [new SonarrSeriesExistsError(371980), 409],
      [new SonarrRejectedError(['Invalid path', 'Other']), 422],
    ]
    for (const [writeError, status] of cases) {
      await withSonarr({ writeError })
      const res = await call('POST', '/api/sonarr/series', addBody)
      expect(res.status, writeError.message).toBe(status)
      expect(JSON.parse(res.body)).toEqual({ error: writeError.message })
      await app!.close()
      app = undefined
    }
  })

  it('missing answers 200 for the asked page', async () => {
    const page = { page: 2, pageSize: 20, totalRecords: 45, records: [] }
    const gateway = await withSonarr({ missing: page })
    const res = await call('GET', '/api/sonarr/missing?page=2')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual(page)
    expect(gateway.calls).toEqual(['listMissing:2'])
  })

  it('missing defaults to page 1 and rejects invalid pages', async () => {
    const gateway = await withSonarr()
    expect((await call('GET', '/api/sonarr/missing')).status).toBe(200)
    for (const page of ['0', 'x', '1.5']) {
      const res = await call('GET', `/api/sonarr/missing?page=${page}`)
      expect(res.status, page).toBe(400)
      expect(JSON.parse(res.body)).toEqual({ error: `página inválida: "${page}"` })
    }
    expect(gateway.calls).toEqual(['listMissing:1'])
  })

  it('bulk episode search answers 202 and rejects invalid bodies', async () => {
    const gateway = await withSonarr()
    expect((await call('POST', '/api/sonarr/episodes/search', { episodeIds: [60, 59] })).status).toBe(202)
    for (const body of [{}, { episodeIds: [] }, { episodeIds: ['a'] }]) {
      expectInvalidBody(await call('POST', '/api/sonarr/episodes/search', body), body)
    }
    expect(gateway.calls).toEqual(['searchEpisodes:[60,59]'])
  })

  it('search all missing answers 202', async () => {
    const gateway = await withSonarr()
    expect((await call('POST', '/api/sonarr/missing/search')).status).toBe(202)
    expect(gateway.calls).toEqual(['searchAllMissing'])
  })

  it('every new route answers 503 when sonarr is off', async () => {
    app = await startTestApp()
    for (const [method, path, body] of NEW_ROUTES) {
      const res = await call(method, path, body)
      expect(res.status, `${method} ${path}`).toBe(503)
      expect(JSON.parse(res.body)).toEqual({ error: 'Sonarr não configurado (SONARR_URL ausente)' })
    }
  })

  it('every new route answers 502 when sonarr fails', async () => {
    const failWith = 'Sonarr indisponível em http://sonarr:8989: timeout'
    await withSonarr({ failWith })
    for (const [method, path, body] of NEW_ROUTES) {
      const res = await call(method, path, body)
      expect(res.status, `${method} ${path}`).toBe(502)
      expect(JSON.parse(res.body)).toEqual({ error: failWith })
    }
  })
})
