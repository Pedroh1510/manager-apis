// @vitest-environment node
import { createServer } from 'node:net'
import type { AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'
import { startServer } from './index.js'

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
    expect(boot.integrations).toEqual({ qbittorrent: true, sonarr: false })
    expect(lines[0]).not.toContain('bob-user')
    expect(lines[0]).not.toContain('s3cr3t-pass')
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

    expect(JSON.parse(lines[0]).integrations).toEqual({ qbittorrent: false, sonarr: true })
    expect(lines[0]).not.toContain('k3y-abc')
  })
})
