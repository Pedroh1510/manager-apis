// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FakeTdarrApi, type FakeTdarrOptions } from '../test/FakeTdarrApi.js'
import { startTestApp, type TestApp } from '../test/startTestApp.js'
import { FetchTdarrGateway } from './tdarrGateway.js'

const API_KEY = 'k-secret-123'
const ROUTES = ['/api/config', '/api/tdarr/overview', '/api/tdarr/stats']
const opened: { close(): Promise<void> }[] = []

afterEach(async () => {
  await Promise.all(opened.splice(0).map((resource) => resource.close()))
})

async function appAgainst(options: FakeTdarrOptions, timeoutMs?: number): Promise<TestApp> {
  const tdarr = await FakeTdarrApi.start(options)
  const app = await startTestApp({ tdarr: new FetchTdarrGateway({ url: tdarr.url, apiKey: API_KEY }, timeoutMs) })
  opened.push(tdarr, app)
  return app
}

describe('tdarr api key', () => {
  it('tdarr api key never leaks', async () => {
    const scenarios = [await appAgainst({}), await appAgainst({ delayMs: 200 }, 50), await appAgainst({ failStatus: 401 })]
    const statuses: number[] = []
    for (const app of scenarios) {
      const answers = await Promise.all(ROUTES.map((path) => fetch(`${app.url}${path}`)))
      statuses.push(...answers.map((answer) => answer.status))
      const output = [...(await Promise.all(answers.map((answer) => answer.text()))), ...app.logLines]
      expect(output.join('\n')).toContain('tdarr')
      for (const text of output) expect(text).not.toContain(API_KEY)
    }
    expect(statuses).toEqual([200, 200, 200, 200, 502, 502, 200, 502, 502])
  })
})
