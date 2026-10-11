// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { callApp } from '../test/callApp.js'
import { FakeSonarrGateway, type FakeSonarrData } from '../test/FakeSonarrGateway.js'
import { startTestApp, type TestApp } from '../test/startTestApp.js'
import { SonarrCommandNotFoundError, SonarrImportFileNotFoundError } from './sonarrGateway.js'
import type { ImportCandidate, StuckDownload } from './manualImport.js'
import type { UploadStore } from '../uploads/uploadStore.js'

let app: TestApp | undefined

afterEach(async () => {
  await app?.close()
  app = undefined
})

function call(method: string, path: string, body?: unknown) {
  return callApp(app!, method, path, body)
}

async function withSonarr(data: FakeSonarrData = {}, uploads: UploadStore | null = null): Promise<FakeSonarrGateway> {
  const gateway = new FakeSonarrGateway(data)
  app = await startTestApp({ sonarr: gateway, uploads })
  return gateway
}

const uploadDir = '/srv/uploads'
const uploadStore = { dir: uploadDir } as UploadStore

const importBody = { downloadId: 'D1', files: [{ path: '/dl/a.mkv', seriesId: 2, episodeIds: [123, 124] }] }
const stuck: StuckDownload = { downloadId: 'D1', title: 'Severance.S02', seriesTitle: 'Severance', state: 'importBlocked', messages: ['Unknown episode'], size: 1 }
const candidate: ImportCandidate = {
  path: '/dl/a.mkv', relativePath: 'a.mkv', size: 1, seriesId: null, seriesTitle: null, episodes: [], quality: 'HDTV-720p', languages: [], releaseGroup: null, rejections: [],
}

const IMPORT_ROUTES: [string, string, unknown?][] = [
  ['GET', '/api/sonarr/import/queue'],
  ['GET', '/api/sonarr/import/files?downloadId=D1'],
  ['POST', '/api/sonarr/import', importBody],
  ['GET', '/api/sonarr/commands/1'],
]

describe('sonarr import routes', () => {
  it('import queue answers 200', async () => {
    await withSonarr({ stuckDownloads: [stuck] })
    const res = await call('GET', '/api/sonarr/import/queue')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual([stuck])
  })

  it('import files answers 200 for the download', async () => {
    const gateway = await withSonarr({ importFiles: [candidate] })
    const res = await call('GET', '/api/sonarr/import/files?downloadId=D1')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual([candidate])
    expect(gateway.calls).toEqual(['listImportFiles:D1'])
  })

  it('blank download id returns 400 without calling sonarr', async () => {
    const gateway = await withSonarr()
    for (const [query, received] of [['?downloadId=', ''], ['?downloadId=%20', ' ']]) {
      const res = await call('GET', `/api/sonarr/import/files${query}`)
      expect(res.status, query).toBe(400)
      expect(JSON.parse(res.body)).toEqual({ error: `downloadId vazio: recebido "${received}"` })
    }
    const noParams = await call('GET', '/api/sonarr/import/files')
    expect(noParams.status).toBe(400)
    expect(JSON.parse(noParams.body)).toEqual({ error: 'consulta inválida: esperado downloadId ou source=upload, recebido {}' })
    expect(gateway.calls).toEqual([])
  })

  it('import answers 202 with the command id', async () => {
    const gateway = await withSonarr({ importCommandId: 392 })
    const res = await call('POST', '/api/sonarr/import', importBody)
    expect(res.status).toBe(202)
    expect(JSON.parse(res.body)).toEqual({ commandId: 392 })
    expect(gateway.calls).toEqual([`startManualImport:D1:${JSON.stringify(importBody.files)}`])
  })

  it('invalid import bodies return 400 without calling sonarr', async () => {
    const gateway = await withSonarr()
    const file = importBody.files[0]
    const invalid = [
      {}, { ...importBody, downloadId: '' }, { ...importBody, files: [] }, { ...importBody, files: [{ ...file, path: '' }] },
      { ...importBody, files: [{ ...file, seriesId: 0 }] }, { ...importBody, files: [{ ...file, episodeIds: [] }] },
      { ...importBody, files: [{ ...file, episodeIds: ['a'] }] },
    ]
    for (const body of invalid) {
      const res = await call('POST', '/api/sonarr/import', body)
      expect(res.status, JSON.stringify(body)).toBe(400)
      const { error } = JSON.parse(res.body)
      expect(error.startsWith('corpo inválido:')).toBe(true)
      expect(error).toContain(JSON.stringify(body))
    }
    expect(gateway.calls).toEqual([])
  })

  it('command state answers 200 and rejects invalid ids', async () => {
    const gateway = await withSonarr({ commandStatus: { state: 'pending', message: null } })
    const res = await call('GET', '/api/sonarr/commands/392')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ state: 'pending', message: null })
    const invalid = await call('GET', '/api/sonarr/commands/x')
    expect(invalid.status).toBe(400)
    expect(JSON.parse(invalid.body)).toEqual({ error: 'id de comando inválido: "x"' })
    expect(gateway.calls).toEqual(['readCommand:392'])
  })

  it('import and command map missing things to 404', async () => {
    await withSonarr({ writeError: new SonarrImportFileNotFoundError({ kind: 'download', downloadId: 'D1' }, '/dl/x.mkv') })
    const missingFile = await call('POST', '/api/sonarr/import', importBody)
    expect(missingFile.status).toBe(404)
    expect(JSON.parse(missingFile.body)).toEqual({ error: 'arquivo não encontrado no download D1: /dl/x.mkv' })
    await app!.close()

    await withSonarr({ readError: new SonarrCommandNotFoundError(392) })
    const missingCommand = await call('GET', '/api/sonarr/commands/392')
    expect(missingCommand.status).toBe(404)
    expect(JSON.parse(missingCommand.body)).toEqual({ error: 'comando 392 não encontrado no Sonarr' })
  })

  it('every import route answers 503 when sonarr is off', async () => {
    app = await startTestApp()
    for (const [method, path, body] of IMPORT_ROUTES) {
      const res = await call(method, path, body)
      expect(res.status, `${method} ${path}`).toBe(503)
      expect(JSON.parse(res.body)).toEqual({ error: 'Sonarr não configurado (SONARR_URL ausente)' })
    }
  })

  it('every import route answers 502 when sonarr fails', async () => {
    const failWith = 'Sonarr indisponível em http://sonarr:8989: timeout'
    await withSonarr({ failWith })
    for (const [method, path, body] of IMPORT_ROUTES) {
      const res = await call(method, path, body)
      expect(res.status, `${method} ${path}`).toBe(502)
      expect(JSON.parse(res.body)).toEqual({ error: failWith })
    }
  })

  it('upload source reads the configured folder', async () => {
    const gateway = await withSonarr({ importFiles: [candidate] }, uploadStore)
    const res = await call('GET', '/api/sonarr/import/files?source=upload&seriesId=2')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual([candidate])
    expect((await call('GET', '/api/sonarr/import/files?source=upload')).status).toBe(200)
    expect(gateway.calls).toEqual([`listImportFiles:folder:${uploadDir}:2`, `listImportFiles:folder:${uploadDir}`])
  })

  it('invalid import file queries return 400', async () => {
    const gateway = await withSonarr({}, uploadStore)
    for (const query of [{}, { source: 'outra' }, { source: 'upload', seriesId: 'x' }]) {
      const res = await call('GET', `/api/sonarr/import/files?${new URLSearchParams(query)}`)
      expect(res.status, JSON.stringify(query)).toBe(400)
      expect(JSON.parse(res.body)).toEqual({ error: `consulta inválida: esperado downloadId ou source=upload, recebido ${JSON.stringify(query)}` })
    }
    expect(gateway.calls).toEqual([])
  })

  it('upload source imports from the configured folder', async () => {
    const gateway = await withSonarr({ importCommandId: 7 }, uploadStore)
    const files = [{ path: `${uploadDir}/a.mkv`, seriesId: 2, episodeIds: [125] }]
    const res = await call('POST', '/api/sonarr/import', { source: 'upload', files })
    expect(res.status).toBe(202)
    expect(JSON.parse(res.body)).toEqual({ commandId: 7 })
    expect(gateway.calls).toEqual([`startManualImport:folder:${uploadDir}:${JSON.stringify(files)}`])
  })
})
