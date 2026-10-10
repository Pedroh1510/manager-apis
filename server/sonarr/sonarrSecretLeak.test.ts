// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FetchSonarrGateway } from './sonarrGateway.js'
import { FakeSonarrApi, type FakeSonarrOptions } from '../test/FakeSonarrApi.js'
import { startTestApp, type TestApp } from '../test/startTestApp.js'

const API_KEY = 'k3y-abc'
const ROUTES = ['/api/config', '/api/sonarr/status', '/api/sonarr/series', '/api/sonarr/series/1']
const opened: { close(): Promise<void> }[] = []

afterEach(async () => {
  await Promise.all(opened.splice(0).map((resource) => resource.close()))
})

async function appAgainst(options: FakeSonarrOptions, timeoutMs?: number): Promise<TestApp> {
  const sonarr = await FakeSonarrApi.start(options)
  const app = await startTestApp({ sonarr: new FetchSonarrGateway({ url: sonarr.url, apiKey: API_KEY }, timeoutMs) })
  opened.push(sonarr, app)
  return app
}

describe('sonarr api key', () => {
  it('never echoes the api key in responses or logs', async () => {
    const scenarios = [
      await appAgainst({}),
      await appAgainst({ delayMs: 200 }, 50),
      await appAgainst({ failStatus: 401 }),
    ]
    for (const app of scenarios) {
      const bodies = await Promise.all(ROUTES.map(async (path) => (await fetch(`${app.url}${path}`)).text()))
      const output = [...bodies, ...app.logLines]
      expect(output.join('\n')).toContain('sonarr')
      for (const text of output) expect(text).not.toContain(API_KEY)
    }
  })
})
