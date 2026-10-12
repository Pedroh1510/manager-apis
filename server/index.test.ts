// @vitest-environment node
import { createServer } from 'node:net'
import type { AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadEnvFileIfPresent, startServer } from './index.js'

async function freePort(): Promise<number> {
  const probe = createServer()
  await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve))
  const { port } = probe.address() as AddressInfo
  await new Promise((resolve) => probe.close(resolve))
  return port
}

describe('startServer', () => {
  it('logs one json boot line without credentials', async () => {
    const port = await freePort()
    const lines: string[] = []
    const env = {
      PORT: String(port),
      QBITTORRENT_URL: 'http://qbit:8080',
      QBITTORRENT_USER: 'bob-user',
      QBITTORRENT_PASS: 's3cr3t-pass',
    }
    const running = await startServer(env, (line) => lines.push(line))
    await running.close()

    expect(lines).toHaveLength(1)
    const boot = JSON.parse(lines[0])
    expect(boot.port).toBe(port)
    expect(boot.integrations).toEqual({ qbittorrent: true, sonarr: false, sonarrUpload: false, tdarr: false })
    expect(lines[0]).not.toContain('bob-user')
    expect(lines[0]).not.toContain('s3cr3t-pass')
  })

  it('sets a two hour request timeout', async () => {
    const running = await startServer({ PORT: String(await freePort()) }, () => {})
    const timeout = running.server.requestTimeout
    await running.close()
    expect(timeout).toBe(7200000)
  })

  it('listens on the configured port', async () => {
    const port = await freePort()
    const running = await startServer({ PORT: String(port) }, () => {})
    const res = await fetch(`http://127.0.0.1:${port}/api/health`)
    await running.close()
    expect(res.status).toBe(200)
  })

  it('boot line reports sonarr without the api key', async () => {
    const port = await freePort()
    const lines: string[] = []
    const running = await startServer({ PORT: String(port), SONARR_URL: 'http://sonarr:8989', SONARR_API_KEY: 'k3y-abc' }, (line) => lines.push(line))
    await running.close()

    expect(JSON.parse(lines[0]).integrations).toEqual({ qbittorrent: false, sonarr: true, sonarrUpload: false, tdarr: false })
    expect(lines[0]).not.toContain('k3y-abc')
  })

  it('boot wires the tdarr gateway from config', async () => {
    const lines: string[] = []
    const withTdarr = await startServer({ PORT: String(await freePort()), TDARR_URL: 'http://127.0.0.1:1', TDARR_API_KEY: 'k-tdarr' }, (line) => lines.push(line))
    const tdarrAnswer = await fetch(`http://127.0.0.1:${(withTdarr.server.address() as AddressInfo).port}/api/tdarr/overview`)
    await withTdarr.close()
    const withoutTdarr = await startServer({ PORT: String(await freePort()) }, (line) => lines.push(line))
    const offAnswer = await fetch(`http://127.0.0.1:${(withoutTdarr.server.address() as AddressInfo).port}/api/tdarr/overview`)
    await withoutTdarr.close()

    expect([tdarrAnswer.status, offAnswer.status]).toEqual([502, 503])
    const boots = lines.filter((line) => line.includes('server started')).map((line) => JSON.parse(line).integrations.tdarr)
    expect(boots).toEqual([true, false])
    expect(lines.join('\n')).not.toContain('k-tdarr')
  })

  it('loads a local .env only when the file exists, without overriding the environment', () => {
    const dir = mkdtempSync(join(tmpdir(), 'manager-apis-env-'))
    const file = join(dir, '.env')
    writeFileSync(file, 'MANAGER_APIS_TEST_FROM_FILE=file\nMANAGER_APIS_TEST_PRESET=file\n')
    process.env.MANAGER_APIS_TEST_PRESET = 'environment'

    expect(loadEnvFileIfPresent(join(dir, 'missing.env'))).toBe(false)
    expect(loadEnvFileIfPresent(file)).toBe(true)
    expect(process.env.MANAGER_APIS_TEST_FROM_FILE).toBe('file')
    expect(process.env.MANAGER_APIS_TEST_PRESET).toBe('environment')
    delete process.env.MANAGER_APIS_TEST_FROM_FILE
    delete process.env.MANAGER_APIS_TEST_PRESET
  })
})
