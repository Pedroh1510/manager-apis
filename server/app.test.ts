// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FakeQbittorrentGateway } from './test/FakeQbittorrentGateway.js'
import { startTestApp, TEST_ASSET_JS, TEST_INDEX_HTML, type TestApp } from './test/startTestApp.js'
import type { RawTorrent } from './qbittorrent/summarizeTorrents.js'

let app: TestApp | undefined

afterEach(async () => {
  await app?.close()
  app = undefined
})

async function get(path: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`${app!.url}${path}`)
  return { status: res.status, body: await res.text() }
}

const INFINITE = 8640000
const row = (hash: string, state: string, progress: number, eta = 60): RawTorrent => ({
  hash, name: hash, state, progress, dlspeed: 100, eta, category: '',
})

/** One torrent per state of the C18 table: 6 downloading, 3 completed, 1 queued, 5 stopped. */
const oneOfEachState: RawTorrent[] = [
  row('e', 'error', 1), row('m', 'missingFiles', 1), row('p', 'pausedDL', 0.3), row('s', 'stoppedDL', 0.3), row('u', 'unknown', 1),
  row('up', 'uploading', 1), row('su', 'stalledUP', 1), row('pu', 'pausedUP', 1),
  row('q', 'queuedDL', 0),
  row('d', 'downloading', 0.5, 600), row('sd', 'stalledDL', 0.5, INFINITE), row('md', 'metaDL', 0, INFINITE),
  row('cd', 'checkingDL', 0.2, 30), row('fd', 'forcedDL', 0.9, 10), row('al', 'allocating', 0, 120),
]

describe('server app', () => {
  it('serves index.html for SPA paths and static files as is', async () => {
    app = await startTestApp(null)
    expect(await get('/torrents')).toEqual({ status: 200, body: TEST_INDEX_HTML })
    expect(await get('/status')).toEqual({ status: 200, body: TEST_INDEX_HTML })
    expect(await get('/assets/app.js')).toEqual({ status: 200, body: TEST_ASSET_JS })
  })

  it('health returns ok', async () => {
    app = await startTestApp(null)
    expect(await get('/api/health')).toEqual({ status: 200, body: JSON.stringify({ status: 'ok' }) })
  })

  it('unknown api route returns 404 json', async () => {
    app = await startTestApp(null)
    const res = await get('/api/nao-existe')
    expect(res.status).toBe(404)
    expect(JSON.parse(res.body)).toEqual({ error: 'rota não encontrada: GET /api/nao-existe' })
    expect(res.body).not.toContain('id="root"')
  })

  it('config reports qbittorrent disabled without url', async () => {
    app = await startTestApp(null)
    expect(await get('/api/config')).toEqual({ status: 200, body: JSON.stringify({ qbittorrent: false }) })
  })

  it('config reports qbittorrent enabled with url', async () => {
    app = await startTestApp(new FakeQbittorrentGateway())
    expect(await get('/api/config')).toEqual({ status: 200, body: JSON.stringify({ qbittorrent: true }) })
  })

  it('qbittorrent routes return 503 when not configured', async () => {
    app = await startTestApp(null)
    for (const path of ['/api/qbittorrent/status', '/api/qbittorrent/torrents']) {
      const res = await get(path)
      expect(res.status, path).toBe(503)
      expect(JSON.parse(res.body)).toEqual({ error: 'qBittorrent não configurado (QBITTORRENT_URL ausente)' })
    }
  })

  it('any qbittorrent subpath returns 503 when not configured', async () => {
    app = await startTestApp(null)
    const res = await get('/api/qbittorrent/foo')
    expect(res.status).toBe(503)
    expect(JSON.parse(res.body)).toEqual({ error: 'qBittorrent não configurado (QBITTORRENT_URL ausente)' })
  })

  it('torrents route returns counts, eta and active list', async () => {
    app = await startTestApp(new FakeQbittorrentGateway({ torrents: oneOfEachState }))
    const res = await get('/api/qbittorrent/torrents')
    const body = JSON.parse(res.body)

    expect(res.status).toBe(200)
    expect(body.counts).toEqual({ downloading: 6, completed: 3, queued: 1, stopped: 5 })
    expect(body.overallEtaSeconds).toBe(600)
    expect(body.etaUnknownCount).toBe(2)
    expect(body.active).toHaveLength(6)
  })

  it('status route returns the gateway status', async () => {
    const status = { version: 'v4.6.7', apiVersion: '2.9.3', downloadSpeed: 2621440, uploadSpeed: 51200 }
    app = await startTestApp(new FakeQbittorrentGateway({ status, torrents: oneOfEachState }))
    const res = await get('/api/qbittorrent/status')

    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ...status, downloading: 6, completed: 3 })
  })

  it('gateway failures return 502 with the gateway message', async () => {
    const failWith = 'qBittorrent indisponível em http://qbit:8080: timeout'
    app = await startTestApp(new FakeQbittorrentGateway({ failWith }))
    for (const path of ['/api/qbittorrent/status', '/api/qbittorrent/torrents']) {
      const res = await get(path)
      expect(res.status, path).toBe(502)
      expect(JSON.parse(res.body)).toEqual({ error: failWith })
    }
  })
})
