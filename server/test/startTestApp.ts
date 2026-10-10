import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from '../app.js'
import { createJsonLogger } from '../logger.js'
import type { QbittorrentGateway } from '../qbittorrent/qbittorrentGateway.js'
import type { SonarrGateway } from '../sonarr/sonarrGateway.js'

export const TEST_INDEX_HTML = '<!doctype html><div id="root"></div>'
export const TEST_ASSET_JS = 'console.log("app")'

export interface TestApp {
  url: string
  logLines: string[]
  close(): Promise<void>
}

/** A dist/ with index.html and one asset, like `vite build` leaves. */
function createTestDist(): string {
  const dir = mkdtempSync(join(tmpdir(), 'manager-apis-dist-'))
  mkdirSync(join(dir, 'assets'))
  writeFileSync(join(dir, 'index.html'), TEST_INDEX_HTML)
  writeFileSync(join(dir, 'assets', 'app.js'), TEST_ASSET_JS)
  return dir
}

/**
 * Boots the real app in-process on an ephemeral port.
 * @example const app = await startTestApp({ qbittorrent: new FakeQbittorrentGateway() }); await fetch(`${app.url}/api/health`)
 */
export async function startTestApp(
  gateways: { qbittorrent?: QbittorrentGateway | null; sonarr?: SonarrGateway | null } = {},
): Promise<TestApp> {
  const logLines: string[] = []
  const logger = createJsonLogger((line) => logLines.push(line))
  const { qbittorrent = null, sonarr = null } = gateways
  const app = createApp({ staticDir: createTestDist(), qbittorrent, sonarr, logger })
  const server: Server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening))
  })
  const { port } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${port}`,
    logLines,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  }
}
