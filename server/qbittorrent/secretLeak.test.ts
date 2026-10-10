// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { CtrlQbittorrentGateway } from './qbittorrentGateway.js'
import { FakeQbittorrentWebUi } from '../test/FakeQbittorrentWebUi.js'
import { startTestApp, type TestApp } from '../test/startTestApp.js'

const PASSWORD = 's3cr3t-pass'
const ROUTES = ['/api/config', '/api/qbittorrent/status', '/api/qbittorrent/torrents']
const opened: { close(): Promise<void> }[] = []

afterEach(async () => {
  await Promise.all(opened.splice(0).map((resource) => resource.close()))
})

async function appAgainst(webUi: FakeQbittorrentWebUi, timeoutMs?: number): Promise<TestApp> {
  const gateway = new CtrlQbittorrentGateway({ url: webUi.url, username: 'bob-user', password: PASSWORD }, timeoutMs)
  const app = await startTestApp({ qbittorrent: gateway })
  opened.push(webUi, app)
  return app
}

async function bodiesOf(app: TestApp): Promise<string[]> {
  return Promise.all(ROUTES.map(async (path) => (await fetch(`${app.url}${path}`)).text()))
}

describe('qbittorrent password', () => {
  it('never echoes the password in responses or logs', async () => {
    const scenarios = [
      await appAgainst(await FakeQbittorrentWebUi.start()),
      await appAgainst(await FakeQbittorrentWebUi.start({ delayMs: 200 }), 50),
      await appAgainst(await FakeQbittorrentWebUi.start({ rejectLogin: true })),
    ]
    for (const app of scenarios) {
      const output = [...(await bodiesOf(app)), ...app.logLines]
      expect(output.join('\n')).toContain('qbittorrent')
      for (const text of output) expect(text).not.toContain(PASSWORD)
    }
  })
})
