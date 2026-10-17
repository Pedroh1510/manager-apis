// @vitest-environment node
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import express from 'express'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { FakeSonarrApi } from '../test/FakeSonarrApi.js'
import { resolveTelemetryConfig } from './config.js'
import { startTelemetry } from './sdk.js'

const root = join(import.meta.dirname, '..', '..')

function listen(server: Server): Promise<number> {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port)))
}

async function closedPort(): Promise<number> {
  const server = createServer()
  const port = await listen(server)
  await new Promise((resolve) => server.close(resolve))
  return port
}

describe('telemetry config', () => {
  it('resolves service name and endpoint defaults and env overrides', () => {
    expect(resolveTelemetryConfig({})).toEqual({ serviceName: 'manager-apis', endpoint: 'http://otel-collector:4318' })
    expect(resolveTelemetryConfig({ OTEL_SERVICE_NAME: 'x', OTEL_EXPORTER_OTLP_ENDPOINT: 'http://y:4318' }))
      .toEqual({ serviceName: 'x', endpoint: 'http://y:4318' })
  })

  it('the image starts node with the telemetry bootstrap', () => {
    const START = ['node', '--import', './dist-server/telemetry.js', 'dist-server/index.js']
    const cmd = readFileSync(join(root, 'Dockerfile'), 'utf8').split('\n').filter((line) => line.startsWith('CMD ')).at(-1) as string
    expect(JSON.parse(cmd.slice('CMD '.length))).toEqual(START)
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    expect(pkg.scripts.start).toBe(START.join(' '))
  })
})

describe('collector unreachable', () => {
  it('app keeps serving while collector is unreachable', async () => {
    const failures: unknown[] = []
    const onFailure = (error: unknown) => failures.push(error)
    process.on('unhandledRejection', onFailure)
    process.on('uncaughtException', onFailure)

    const sdk = startTelemetry(
      { serviceName: 'manager-apis', endpoint: `http://127.0.0.1:${await closedPort()}` },
      { exportIntervalMillis: 500 },
    )
    const app = express()
    app.get('/ping', (_req, res) => void res.status(200).send('pong'))
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/ping`)

    await sleep(10_000)
    server.close()
    await sdk.shutdown().catch(() => {})
    process.off('unhandledRejection', onFailure)
    process.off('uncaughtException', onFailure)

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('pong')
    expect(failures).toEqual([])
  }, 30_000)
})

// The app runs for real (built dist-server, node --import) against a fake
// Sonarr and an unreachable Tdarr, exporting to a capture server here: no
// collector, no sampling (app-observability C25, C28).
interface Span {
  traceId: string
  name: string
  kind: number
  attributes?: { key: string; value: Record<string, unknown> }[]
}

const SPAN_KIND = { server: 2, client: 3 }

describe('trace join on a real request', () => {
  const spans: Span[] = []
  const stdoutLines: string[] = []
  let capture: Server
  let sonarr: FakeSonarrApi
  let app: ChildProcess
  let base: string

  const attributes = (span: Span) =>
    Object.fromEntries((span.attributes ?? []).map(({ key, value }) => [key, Object.values(value)[0]]))
  const serverSpan = (route: string) =>
    spans.find((span) => span.kind === SPAN_KIND.server && attributes(span)['http.route'] === route)

  async function waitFor(check: () => boolean) {
    const deadline = Date.now() + 30_000
    while (!check() && Date.now() < deadline) await sleep(500)
  }

  beforeAll(async () => {
    const build = spawnSync('npx', ['tsc', '-p', 'tsconfig.server.json'], { cwd: root, stdio: 'inherit' })
    if (build.status !== 0) throw new Error('server build failed')
    capture = createServer((req, res) => {
      let body = ''
      req.on('data', (chunk) => (body += chunk))
      req.on('end', () => {
        if (req.url === '/v1/traces') {
          for (const resourceSpans of JSON.parse(body).resourceSpans ?? []) {
            for (const scopeSpans of resourceSpans.scopeSpans ?? []) spans.push(...scopeSpans.spans)
          }
        }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end('{}')
      })
    })
    const capturePort = await listen(capture)
    sonarr = await FakeSonarrApi.start()
    const port = await closedPort()
    app = spawn('node', ['--import', './dist-server/telemetry.js', 'dist-server/index.js'], {
      cwd: root,
      env: {
        PATH: process.env.PATH,
        PORT: `${port}`,
        SONARR_URL: sonarr.url,
        SONARR_API_KEY: 'test-key',
        TDARR_URL: `http://127.0.0.1:${await closedPort()}`,
        OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${capturePort}`,
      },
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    app.stdout?.on('data', (chunk) => stdoutLines.push(...String(chunk).split('\n').filter(Boolean)))
    base = `http://127.0.0.1:${port}`
    await waitFor(() => stdoutLines.some((line) => line.includes('server started')))
    await fetch(`${base}/api/sonarr/series`)
    await fetch(`${base}/api/tdarr/stats`)
    await waitFor(() => !!serverSpan('/api/sonarr/series') && !!serverSpan('/api/tdarr/stats'))
  }, 120_000)

  afterAll(async () => {
    app?.kill('SIGTERM')
    await sonarr?.close()
    await new Promise((resolve) => capture?.close(resolve))
  })

  it('request trace joins http server and http client spans', () => {
    const request = serverSpan('/api/sonarr/series')
    expect(request).toBeDefined()
    const clients = spans.filter((span) => span.traceId === request?.traceId && span.kind === SPAN_KIND.client)
    expect(clients.map((span) => attributes(span)['server.address'])).toContain('127.0.0.1')
  })

  it('error log line carries the request trace_id', () => {
    const request = serverSpan('/api/tdarr/stats')
    expect(request).toBeDefined()
    const lines = stdoutLines.map((line) => JSON.parse(line)).filter((line) => line.msg === 'tdarr request failed')
    expect(lines.map((line) => line.trace_id)).toContain(request?.traceId)
  })
})
