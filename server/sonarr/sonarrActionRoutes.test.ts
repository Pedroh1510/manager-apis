// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FakeSonarrGateway, type FakeSonarrData } from '../test/FakeSonarrGateway.js'
import { startTestApp, type TestApp } from '../test/startTestApp.js'
import { SonarrReleaseExpiredError, SonarrSeasonNotFoundError } from './sonarrGateway.js'

let app: TestApp | undefined

afterEach(async () => {
  await app?.close()
  app = undefined
})

async function call(method: string, path: string, body?: unknown): Promise<{ status: number; body: string }> {
  const res = await fetch(`${app!.url}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  return { status: res.status, body: await res.text() }
}

async function withSonarr(data: FakeSonarrData = {}): Promise<FakeSonarrGateway> {
  const gateway = new FakeSonarrGateway(data)
  app = await startTestApp({ sonarr: gateway })
  return gateway
}

const NEW_ROUTES: [string, string, unknown?][] = [
  ['PUT', '/api/sonarr/episodes/monitor', { episodeIds: [11], monitored: true }],
  ['PUT', '/api/sonarr/series/1/seasons/1/monitor', { monitored: true }],
  ['POST', '/api/sonarr/episodes/11/search'],
  ['POST', '/api/sonarr/series/1/seasons/1/search'],
  ['GET', '/api/sonarr/releases?episodeId=11'],
  ['POST', '/api/sonarr/releases', { guid: 'g1', indexerId: 3 }],
]

describe('sonarr action routes', () => {
  it('episode monitor calls the gateway and answers 204', async () => {
    const gateway = await withSonarr()
    const res = await call('PUT', '/api/sonarr/episodes/monitor', { episodeIds: [11, 12], monitored: false })
    expect(res.status).toBe(204)
    expect(gateway.calls).toEqual(['setEpisodesMonitored:[11,12]:false'])
  })

  it('invalid monitor bodies return 400 without calling sonarr', async () => {
    const gateway = await withSonarr()
    const bodies = [{}, { episodeIds: [], monitored: true }, { episodeIds: ['a'], monitored: true }, { episodeIds: [0], monitored: true }, { episodeIds: [1], monitored: 'sim' }]
    for (const body of bodies) {
      const res = await call('PUT', '/api/sonarr/episodes/monitor', body)
      expect(res.status, JSON.stringify(body)).toBe(400)
      const { error } = JSON.parse(res.body)
      expect(error.startsWith('corpo inválido:')).toBe(true)
      expect(error).toContain(JSON.stringify(body))
    }
    expect(gateway.calls).toEqual([])
  })

  it('season monitor calls the gateway and answers 204', async () => {
    const gateway = await withSonarr()
    const res = await call('PUT', '/api/sonarr/series/1/seasons/1/monitor', { monitored: false })
    expect(res.status).toBe(204)
    expect(gateway.calls).toEqual(['setSeasonMonitored:1:1:false'])
  })

  it('invalid or unknown season returns 400 or 404', async () => {
    const gateway = await withSonarr({ writeError: new SonarrSeasonNotFoundError(1, 9) })
    for (const season of ['x', '-1']) {
      const res = await call('PUT', `/api/sonarr/series/1/seasons/${season}/monitor`, { monitored: true })
      expect(res.status, season).toBe(400)
      expect(JSON.parse(res.body).error).toContain(`temporada inválida: "${season}"`)
    }
    expect(gateway.calls).toEqual([])
    const missing = await call('PUT', '/api/sonarr/series/1/seasons/9/monitor', { monitored: true })
    expect(missing.status).toBe(404)
    expect(JSON.parse(missing.body)).toEqual({ error: 'temporada 9 não encontrada na série 1' })
  })

  it('search routes answer 202', async () => {
    const gateway = await withSonarr()
    expect((await call('POST', '/api/sonarr/episodes/11/search')).status).toBe(202)
    expect((await call('POST', '/api/sonarr/series/1/seasons/2/search')).status).toBe(202)
    expect(gateway.calls).toEqual(['searchEpisode:11', 'searchSeason:1:2'])
  })

  it('invalid search ids return 400 without calling sonarr', async () => {
    const gateway = await withSonarr()
    const cases: [string, string][] = [
      ['/api/sonarr/episodes/abc/search', 'id de episódio inválido: "abc"'],
      ['/api/sonarr/series/0/seasons/1/search', 'id de série inválido: "0"'],
      ['/api/sonarr/series/1/seasons/x/search', 'temporada inválida: "x"'],
    ]
    for (const [path, message] of cases) {
      const res = await call('POST', path)
      expect(res.status, path).toBe(400)
      expect(JSON.parse(res.body).error).toContain(message)
    }
    expect(gateway.calls).toEqual([])
  })

  it('releases query is validated and forwarded', async () => {
    const gateway = await withSonarr({ releases: [] })
    const invalid: [string, Record<string, string>][] = [
      ['', {}], ['?episodeId=abc', { episodeId: 'abc' }], ['?seriesId=1', { seriesId: '1' }], ['?seriesId=1&seasonNumber=x', { seriesId: '1', seasonNumber: 'x' }],
    ]
    for (const [query, received] of invalid) {
      const res = await call('GET', `/api/sonarr/releases${query}`)
      expect(res.status, query).toBe(400)
      expect(JSON.parse(res.body)).toEqual({ error: `consulta inválida: esperado episodeId ou seriesId+seasonNumber, recebido ${JSON.stringify(received)}` })
    }
    expect((await call('GET', '/api/sonarr/releases?episodeId=11')).status).toBe(200)
    expect((await call('GET', '/api/sonarr/releases?seriesId=1&seasonNumber=2')).status).toBe(200)
    expect(gateway.calls).toEqual(['listReleases:{"episodeId":11}', 'listReleases:{"seriesId":1,"seasonNumber":2}'])
  })

  it('grab validates the body and answers 204', async () => {
    const gateway = await withSonarr()
    expect((await call('POST', '/api/sonarr/releases', { guid: 'g1', indexerId: 3 })).status).toBe(204)
    for (const body of [{ guid: '', indexerId: 3 }, { guid: 'g1', indexerId: 0 }]) {
      const res = await call('POST', '/api/sonarr/releases', body)
      expect(res.status, JSON.stringify(body)).toBe(400)
      expect(JSON.parse(res.body)).toEqual({
        error: `corpo inválido: esperado { guid: texto não vazio, indexerId: inteiro positivo }, recebido ${JSON.stringify(body)}`,
      })
    }
    expect(gateway.calls).toEqual(['grabRelease:g1:3'])
  })

  it('expired release returns 404', async () => {
    await withSonarr({ writeError: new SonarrReleaseExpiredError() })
    const res = await call('POST', '/api/sonarr/releases', { guid: 'gone', indexerId: 3 })
    expect(res.status).toBe(404)
    expect(JSON.parse(res.body)).toEqual({ error: 'release não está mais no cache do Sonarr: refaça a busca interativa' })
  })

  it('malformed json returns 400', async () => {
    await withSonarr()
    const res = await call('PUT', '/api/sonarr/episodes/monitor', '{nao-json')
    expect(res.status).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ error: 'corpo JSON inválido' })
  })

  it('new routes return 503 when not configured', async () => {
    app = await startTestApp()
    for (const [method, path, body] of NEW_ROUTES) {
      const res = await call(method, path, body)
      expect(res.status, `${method} ${path}`).toBe(503)
      expect(JSON.parse(res.body)).toEqual({ error: 'Sonarr não configurado (SONARR_URL ausente)' })
    }
  })

  it('new routes return 502 with the gateway message', async () => {
    for (const failWith of ['Sonarr indisponível em http://sonarr:8989: timeout', 'Sonarr recusou a API key (SONARR_API_KEY)']) {
      await withSonarr({ failWith })
      for (const [method, path, body] of NEW_ROUTES) {
        const res = await call(method, path, body)
        expect(res.status, `${method} ${path}`).toBe(502)
        expect(JSON.parse(res.body)).toEqual({ error: failWith })
      }
      await app!.close()
      app = undefined
    }
  })
})
