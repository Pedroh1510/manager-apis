// @vitest-environment node
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { SonarrSeriesExistsError } from './sonarr/sonarrGateway.js'
import { callApp } from './test/callApp.js'
import { FakeSonarrGateway, type FakeSonarrData } from './test/FakeSonarrGateway.js'
import { installMeterProvider } from './test/meters.js'
import { startTestApp, type TestApp } from './test/startTestApp.js'
import { FsUploadStore } from './uploads/uploadStore.js'

// app-observability door 2d: one counter per user action that changes Sonarr or the upload folder
let meters: ReturnType<typeof installMeterProvider>
let app: TestApp | undefined

beforeAll(() => {
  meters = installMeterProvider()
})

afterAll(async () => {
  await meters.uninstall()
})

afterEach(async () => {
  await app?.close()
  app = undefined
})

async function withSonarr(data: FakeSonarrData = {}): Promise<void> {
  const uploads = new FsUploadStore(mkdtempSync(join(tmpdir(), 'business-uploads-')))
  app = await startTestApp({ sonarr: new FakeSonarrGateway(data), uploads })
}

/** Sum of the counter per `source/result`, e.g. { 'sonarr/ok': 2 }. */
async function totals(name: string): Promise<Record<string, number>> {
  const points = await meters.points(name)
  return Object.fromEntries(points.map((point) => [`${point.attributes.source}/${point.attributes.result}`, point.value as number]))
}

const addBody = { tvdbId: 371980, qualityProfileId: 4, rootFolderPath: '/tv', seriesType: 'anime', monitor: 'lastSeason', searchForMissingEpisodes: false }
const importBody = { downloadId: 'D1', files: [{ path: '/dl/a.mkv', seriesId: 2, episodeIds: [123, 124] }] }

describe('business counters on the real routes', () => {
  it('adding a series counts ok, a refused add counts fail, a bad body counts nothing', async () => {
    await withSonarr()
    expect((await callApp(app!, 'POST', '/api/sonarr/series', addBody)).status).toBe(201)
    expect((await callApp(app!, 'POST', '/api/sonarr/series', { tvdbId: 'x' })).status).toBe(400)
    await app!.close()
    await withSonarr({ writeError: new SonarrSeriesExistsError(371980) })
    expect((await callApp(app!, 'POST', '/api/sonarr/series', addBody)).status).toBe(409)

    expect(await totals('apis.series.added')).toEqual({ 'sonarr/ok': 1, 'sonarr/fail': 1 })
  })

  it('every search route counts one search', async () => {
    await withSonarr()
    for (const [path, body] of [
      ['/api/sonarr/episodes/60/search'],
      ['/api/sonarr/series/2/seasons/1/search'],
      ['/api/sonarr/episodes/search', { episodeIds: [60] }],
      ['/api/sonarr/missing/search'],
    ] as [string, unknown?][]) {
      expect((await callApp(app!, 'POST', path, body)).status, path).toBe(202)
    }

    expect(await totals('apis.searches.requested')).toEqual({ 'sonarr/ok': 4 })
  })

  it('grabbing a release and starting an import count once each', async () => {
    await withSonarr()
    expect((await callApp(app!, 'POST', '/api/sonarr/releases', { guid: 'g1', indexerId: 3 })).status).toBe(204)
    expect((await callApp(app!, 'POST', '/api/sonarr/import', importBody)).status).toBe(202)

    expect(await totals('apis.releases.grabbed')).toEqual({ 'sonarr/ok': 1 })
    expect(await totals('apis.imports.started')).toEqual({ 'sonarr/ok': 1 })
  })

  it('storing an upload counts ok, a duplicate counts fail, a bad name counts nothing', async () => {
    await withSonarr()
    const put = (name: string) =>
      fetch(`${app!.url}/api/sonarr/uploads/${name}`, { method: 'PUT', body: Buffer.from('x'), headers: { 'Content-Type': 'application/octet-stream' } })
    expect((await put('ep01.mkv')).status).toBe(201)
    expect((await put('ep01.mkv')).status).toBe(409)
    expect((await put('ep01.exe')).status).toBe(400)

    expect(await totals('apis.uploads.stored')).toEqual({ 'local/ok': 1, 'local/fail': 1 })
  })
})
