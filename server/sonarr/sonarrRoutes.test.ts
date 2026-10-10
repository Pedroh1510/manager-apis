// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FakeSonarrGateway, type FakeSonarrData } from '../test/FakeSonarrGateway.js'
import { startTestApp, type TestApp } from '../test/startTestApp.js'
import type { SeriesDetail, SeriesSummary } from './seriesDetail.js'

let app: TestApp | undefined

afterEach(async () => {
  await app?.close()
  app = undefined
})

async function get(path: string): Promise<{ status: number; body: string; headers: Headers }> {
  const res = await fetch(`${app!.url}${path}`)
  return { status: res.status, body: await res.text(), headers: res.headers }
}

async function withSonarr(data: FakeSonarrData = {}): Promise<FakeSonarrGateway> {
  const gateway = new FakeSonarrGateway(data)
  app = await startTestApp({ sonarr: gateway })
  return gateway
}

const wire: SeriesSummary = {
  id: 1, title: 'The Wire', alternateTitles: [], year: 2002, status: 'ended', network: 'HBO', episodeFileCount: 60, episodeCount: 60, added: '',
}
const wireDetail: SeriesDetail = {
  id: 1, title: 'The Wire', year: 2002, status: 'ended', network: 'HBO', overview: 'Baltimore.', sizeOnDisk: 1,
  episodeFileCount: 60, episodeCount: 60, seasons: [],
}

describe('sonarr routes', () => {
  it('every sonarr route returns 503 when not configured', async () => {
    app = await startTestApp()
    for (const path of ['/api/sonarr/status', '/api/sonarr/series', '/api/sonarr/series/1', '/api/sonarr/series/1/poster', '/api/sonarr/foo']) {
      const res = await get(path)
      expect(res.status, path).toBe(503)
      expect(JSON.parse(res.body)).toEqual({ error: 'Sonarr não configurado (SONARR_URL ausente)' })
    }
  })

  it('status route returns the gateway status', async () => {
    const status = { version: '4.0.9.2244', health: [{ type: 'warning', message: 'x' }], queueCount: 7, rootFolders: [{ path: '/tv', freeSpace: 1 }] }
    await withSonarr({ status })
    const res = await get('/api/sonarr/status')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual(status)
  })

  it('series route returns the gateway list', async () => {
    await withSonarr({ series: [wire] })
    const res = await get('/api/sonarr/series')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual([wire])
  })

  it('series detail route returns the gateway detail', async () => {
    await withSonarr({ details: { 1: wireDetail } })
    const res = await get('/api/sonarr/series/1')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual(wireDetail)
  })

  it('invalid series id returns 400 without calling sonarr', async () => {
    const gateway = await withSonarr()
    for (const id of ['abc', '0', '-1']) {
      const res = await get(`/api/sonarr/series/${id}`)
      expect(res.status, id).toBe(400)
      expect(JSON.parse(res.body)).toEqual({ error: `id de série inválido: "${id}", esperado inteiro positivo` })
    }
    const poster = await get('/api/sonarr/series/abc/poster')
    expect(poster.status).toBe(400)
    expect(JSON.parse(poster.body)).toEqual({ error: 'id de série inválido: "abc", esperado inteiro positivo' })
    expect(gateway.calls).toEqual([])
  })

  it('unknown series returns 404', async () => {
    await withSonarr()
    for (const path of ['/api/sonarr/series/999', '/api/sonarr/series/999/poster']) {
      const res = await get(path)
      expect(res.status, path).toBe(404)
      expect(JSON.parse(res.body)).toEqual({ error: 'série 999 não encontrada no Sonarr' })
    }
  })

  it('poster route streams the bytes with a one day cache', async () => {
    const bytes = new TextEncoder().encode('jpeg-bytes').buffer as ArrayBuffer
    await withSonarr({ posters: { 1: { contentType: 'image/jpeg', bytes } } })
    const res = await get('/api/sonarr/series/1/poster')

    expect(res.status).toBe(200)
    expect(res.body).toBe('jpeg-bytes')
    expect(res.headers.get('content-type')).toBe('image/jpeg')
    expect(res.headers.get('cache-control')).toBe('max-age=86400')
  })

  it('gateway failures return 502 with the gateway message', async () => {
    for (const failWith of ['Sonarr indisponível em http://sonarr:8989: timeout', 'Sonarr recusou a API key (SONARR_API_KEY)']) {
      await withSonarr({ failWith })
      for (const path of ['/api/sonarr/status', '/api/sonarr/series', '/api/sonarr/series/1', '/api/sonarr/series/1/poster']) {
        const res = await get(path)
        expect(res.status, path).toBe(502)
        expect(JSON.parse(res.body)).toEqual({ error: failWith })
      }
      await app!.close()
      app = undefined
    }
  })
})
