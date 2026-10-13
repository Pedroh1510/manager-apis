// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FakeTdarrApi, type FakeTdarrOptions } from '../test/FakeTdarrApi.js'
import { FetchTdarrGateway, TdarrGatewayError } from './tdarrGateway.js'
import type { RawTdarrNode } from './tdarrNodes.js'

const NOW = new Date(1791830500000)

const NODES: Record<string, RawTdarrNode> = {
  pc: {
    _id: 'pc', nodeName: 'pc-rtx2060', nodePaused: false, lastSeenTime: NOW.getTime() - 1000,
    workerLimits: { transcodegpu: 2, transcodecpu: 0, healthcheckgpu: 0, healthcheckcpu: 0 },
    workers: { w1: { _id: 'w1', workerType: 'transcodegpu', file: '/m/a.mkv', percentage: 50, ETA: '0:01:00', fps: 90, idle: false, originalfileSizeInGbytes: 2, estSize: 1 } },
  },
  cpu: {
    _id: 'cpu', nodeName: 'homelab-cpu', nodePaused: true, lastSeenTime: NOW.getTime() - 120000,
    workerLimits: { transcodegpu: 0, transcodecpu: 0, healthcheckgpu: 0, healthcheckcpu: 1 },
    workers: {},
  },
}

let tdarr: FakeTdarrApi | undefined

afterEach(async () => {
  await tdarr?.close()
  tdarr = undefined
})

async function gatewayFor(options: FakeTdarrOptions, apiKey: string | null = null, timeoutMs = 2000): Promise<FetchTdarrGateway> {
  tdarr = await FakeTdarrApi.start(options)
  return new FetchTdarrGateway({ url: tdarr.url, apiKey }, timeoutMs, () => NOW)
}

describe('FetchTdarrGateway', () => {
  it('api key header is sent only when configured', async () => {
    const withKey = await gatewayFor({ nodes: NODES }, 'k-123')
    await withKey.readOverview()
    await withKey.readStats()
    expect(tdarr!.requests.length).toBeGreaterThan(0)
    expect(tdarr!.requests.every((request) => request.apiKey === 'k-123')).toBe(true)
    await tdarr!.close()

    const withoutKey = await gatewayFor({ nodes: NODES }, null)
    await withoutKey.readOverview()
    await withoutKey.readStats()
    expect(tdarr!.requests.length).toBeGreaterThan(0)
    expect(tdarr!.requests.every((request) => request.apiKey === undefined)).toBe(true)
  })

  it('overview reads status and nodes', async () => {
    const gateway = await gatewayFor({ nodes: NODES, version: '2.94.02' })
    const overview = await gateway.readOverview()

    expect(tdarr!.requests.map(({ method, url }) => `${method} ${url}`)).toEqual(['GET /api/v2/status', 'GET /api/v2/get-nodes'])
    expect(overview.version).toBe('2.94.02')
    expect(overview.nodes).toEqual([
      {
        id: 'pc', name: 'pc-rtx2060', paused: false, online: true, busyWorkers: 1, workerCapacity: 2,
        workerLimits: { transcodeGpu: 2, transcodeCpu: 0, healthCheckGpu: 0, healthCheckCpu: 0 },
        workers: [{ id: 'w1', kind: 'transcode', hardware: 'gpu', file: '/m/a.mkv', percentage: 50, eta: '0:01:00', fps: 90, originalSizeGb: 2, estimatedSizeGb: 1 }],
      },
      {
        id: 'cpu', name: 'homelab-cpu', paused: true, online: false, busyWorkers: 0, workerCapacity: 1,
        workerLimits: { transcodeGpu: 0, transcodeCpu: 0, healthCheckGpu: 0, healthCheckCpu: 1 },
        workers: [],
      },
    ])
  })

  it('error lists use the fixed status tables body', async () => {
    const failed = Array.from({ length: 2 }, (_, index) => ({ file: `/s/${index}.mkv`, DB: 'lib', lastTranscodeDate: 1791799200000 - index }))
    const gateway = await gatewayFor({
      libraries: [{ _id: 'lib', name: 'series' }],
      tables: { table3: { array: failed, totalCount: 73 }, table6: { array: [], totalCount: 0 } },
    })

    const stats = await gateway.readStats()

    const bodies = tdarr!.requests.filter(({ url }) => url === '/api/v2/client/status-tables').map(({ body }) => body)
    expect(bodies).toEqual([
      { data: { start: 0, pageSize: 50, filters: [], sorts: [{ id: 'lastTranscodeDate', desc: true }], opts: { table: 'table3' } } },
      { data: { start: 0, pageSize: 50, filters: [], sorts: [{ id: 'lastHealthCheckDate', desc: true }], opts: { table: 'table6' } } },
    ])
    expect(stats.errors.transcode.total).toBe(73)
    expect(stats.errors.transcode.items.map(({ file }) => file)).toEqual(['/s/0.mkv', '/s/1.mkv'])
    expect(stats.errors.transcode.items[0].library).toBe('series')
    expect(stats.errors.healthCheck).toEqual({ total: 0, items: [] })
  })

  it('upstream failures become gateway errors', async () => {
    const cases: [string, () => Promise<FetchTdarrGateway>, RegExp][] = [
      ['timeout', () => gatewayFor({ delayMs: 300 }, null, 50), /Tdarr indisponível em .*: .*(timeout|aborted).* em \/api\/v2\/status$/i],
      ['status 500', () => gatewayFor({ failStatus: 500 }), /Tdarr indisponível em .*: HTTP 500 em \/api\/v2\/status/],
      ['status 401', () => gatewayFor({ failStatus: 401 }), /^Tdarr recusou a API key \(TDARR_API_KEY\) em \/api\/v2\/status$/],
      ['broken json', () => gatewayFor({ brokenJson: true }), /Tdarr indisponível em .*: resposta não é JSON em \/api\/v2\/status/],
    ]
    for (const [name, build, message] of cases) {
      const gateway = await build()
      await expect(gateway.readOverview(), name).rejects.toThrow(TdarrGatewayError)
      await expect(gateway.readOverview(), name).rejects.toThrow(message)
      await tdarr!.close()
      tdarr = undefined
    }

    const closed = await FakeTdarrApi.start()
    const closedUrl = closed.url
    await closed.close()
    const refused = new FetchTdarrGateway({ url: closedUrl, apiKey: null }, 2000, () => NOW)
    await expect(refused.readStats()).rejects.toThrow(TdarrGatewayError)
    await expect(refused.readStats()).rejects.toThrow(`Tdarr indisponível em ${closedUrl}: fetch failed (ECONNREFUSED) em /api/v2/cruddb`)
  })

  it('only read endpoints are called', async () => {
    const gateway = await gatewayFor({ nodes: NODES })
    await gateway.readOverview()
    await gateway.readStats()

    const calls = tdarr!.requests.map(({ method, url, body }) => {
      const data = (body as { data?: { collection?: string } } | undefined)?.data
      return data?.collection ? `${method} ${url} ${data.collection}` : `${method} ${url}`
    })
    expect(calls.sort()).toEqual([
      'GET /api/v2/get-nodes',
      'GET /api/v2/status',
      'POST /api/v2/client/status-tables',
      'POST /api/v2/client/status-tables',
      'POST /api/v2/cruddb LibrarySettingsJSONDB',
      'POST /api/v2/cruddb StatisticsJSONDB',
    ])
    for (const { url, body } of tdarr!.requests) {
      const data = (body as { data: { mode?: string; opts?: object } } | undefined)?.data
      if (url === '/api/v2/cruddb') expect(data?.mode).toBe('getAll')
      if (url === '/api/v2/client/status-tables') expect(Object.keys(data?.opts ?? {})).toEqual(['table'])
    }
  })
})

describe('TdarrGatewayError', () => {
  it('is an Error', () => {
    expect(new TdarrGatewayError('x')).toBeInstanceOf(Error)
  })
})
