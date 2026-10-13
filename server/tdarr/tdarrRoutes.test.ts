// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { callApp } from '../test/callApp.js'
import { FakeTdarrGateway } from '../test/FakeTdarrGateway.js'
import { startTestApp, type TestApp } from '../test/startTestApp.js'
import type { TdarrOverview } from './tdarrNodes.js'
import type { TdarrStats } from './tdarrStats.js'

const OVERVIEW: TdarrOverview = {
  version: '2.94.02',
  nodes: [{
    id: 'pc', name: 'pc-rtx2060', paused: false, online: true, busyWorkers: 0, workerCapacity: 2,
    workerLimits: { transcodeGpu: 2, transcodeCpu: 0, healthCheckGpu: 0, healthCheckCpu: 0 }, workers: [],
  }],
}

const STATS: TdarrStats = {
  totals: { files: 10, transcodes: 5, healthChecks: 10, spaceSavedGb: 1.5 },
  transcode: { onHold: 0, queued: 2, succeeded: 7, failed: 1 },
  healthCheck: { queued: 0, succeeded: 10, failed: 0 },
  errors: { transcode: { total: 1, items: [{ file: '/s/a.mkv', library: 'series', date: null }] }, healthCheck: { total: 0, items: [] } },
}

let app: TestApp | undefined

afterEach(async () => {
  await app?.close()
  app = undefined
})

describe('/api/tdarr', () => {
  it('tdarr routes answer 503 when not configured', async () => {
    app = await startTestApp()
    for (const path of ['/api/tdarr/overview', '/api/tdarr/stats']) {
      expect(await callApp(app, 'GET', path)).toEqual({ status: 503, body: JSON.stringify({ error: 'Tdarr não configurado (TDARR_URL ausente)' }) })
    }
  })

  it('overview answers 200 with the gateway result', async () => {
    app = await startTestApp({ tdarr: new FakeTdarrGateway({ overview: OVERVIEW }) })
    const res = await callApp(app, 'GET', '/api/tdarr/overview')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual(OVERVIEW)
  })

  it('stats answers 200 with the gateway result', async () => {
    app = await startTestApp({ tdarr: new FakeTdarrGateway({ stats: STATS }) })
    const res = await callApp(app, 'GET', '/api/tdarr/stats')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual(STATS)
  })

  it('gateway error answers 502 and is logged', async () => {
    const message = 'Tdarr indisponível em http://tdarr:8265: HTTP 500 em /api/v2/status'
    app = await startTestApp({ tdarr: new FakeTdarrGateway({ failWith: message }) })
    for (const path of ['/api/tdarr/overview', '/api/tdarr/stats']) {
      expect(await callApp(app, 'GET', path)).toEqual({ status: 502, body: JSON.stringify({ error: message }) })
    }
    const logged = app.logLines.map((line) => JSON.parse(line)).filter((line) => line.msg === 'tdarr request failed')
    expect(logged).toHaveLength(2)
    expect(logged[0]).toMatchObject({ path: '/api/tdarr/overview', reason: message })
  })
})
