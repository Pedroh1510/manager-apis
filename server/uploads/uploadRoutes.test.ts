// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, utimesSync, writeFileSync } from 'node:fs'
import { request } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { callApp } from '../test/callApp.js'
import { FakeSonarrGateway } from '../test/FakeSonarrGateway.js'
import { startTestApp, type TestApp } from '../test/startTestApp.js'
import { FsUploadStore } from './uploadStore.js'

let app: TestApp | undefined

afterEach(async () => {
  await app?.close()
  app = undefined
})

async function withUploads(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'upload-routes-'))
  app = await startTestApp({ sonarr: new FakeSonarrGateway(), uploads: new FsUploadStore(dir) })
  return dir
}

async function put(path: string, body: Buffer, headers: Record<string, string> = {}): Promise<{ status: number; body: string }> {
  const res = await fetch(`${app!.url}${path}`, { method: 'PUT', body, headers: { 'Content-Type': 'application/octet-stream', ...headers } })
  return { status: res.status, body: await res.text() }
}

const INVALID_NAME = (name: string) =>
  `nome de arquivo inválido: "${name}", esperado nome simples com extensão .mkv, .mp4, .avi, .srt ou .ass`

describe('upload routes', () => {
  it('every upload route answers 503 when upload is off', async () => {
    app = await startTestApp({ sonarr: new FakeSonarrGateway() })
    const files = [{ path: '/x/a.mkv', seriesId: 1, episodeIds: [1] }]
    const calls: [string, string, unknown?][] = [
      ['PUT', '/api/sonarr/uploads/a.mkv', 'x'], ['GET', '/api/sonarr/uploads'], ['DELETE', '/api/sonarr/uploads/a.mkv'],
      ['GET', '/api/sonarr/import/files?source=upload'], ['POST', '/api/sonarr/import', { source: 'upload', files }],
    ]
    for (const [method, path, body] of calls) {
      const res = await callApp(app, method, path, body)
      expect(res.status, `${method} ${path}`).toBe(503)
      expect(JSON.parse(res.body)).toEqual({ error: 'upload desligado (SONARR_UPLOAD_DIR ausente)' })
    }
  })

  it('put stores the body under its name and answers 201', async () => {
    const dir = await withUploads()
    const res = await put('/api/sonarr/uploads/Ep%2007.mkv', Buffer.alloc(3000, 7))
    expect(res.status).toBe(201)
    expect(JSON.parse(res.body)).toEqual({ name: 'Ep 07.mkv', size: 3000 })
    expect(readdirSync(dir)).toEqual(['Ep 07.mkv'])
    expect(readFileSync(join(dir, 'Ep 07.mkv')).equals(Buffer.alloc(3000, 7))).toBe(true)
  })

  it('invalid names return 400 without touching the folder', async () => {
    const dir = await withUploads()
    writeFileSync(join(dir, 'keep.mkv'), 'x')
    for (const [encoded, name] of [['a.txt', 'a.txt'], ['..%2Fa.mkv', '../a.mkv']]) {
      for (const method of ['PUT', 'DELETE']) {
        const res = await callApp(app!, method, `/api/sonarr/uploads/${encoded}`, method === 'PUT' ? 'x' : undefined)
        expect(res.status, `${method} ${name}`).toBe(400)
        expect(JSON.parse(res.body)).toEqual({ error: INVALID_NAME(name) })
      }
    }
    expect(readdirSync(dir)).toEqual(['keep.mkv'])
  })

  it('an existing name or part file returns 409 and keeps the old file', async () => {
    const dir = await withUploads()
    writeFileSync(join(dir, 'a.mkv'), 'old')
    writeFileSync(join(dir, 'b.mkv.part'), 'sending')
    for (const name of ['a.mkv', 'b.mkv']) {
      const res = await put(`/api/sonarr/uploads/${name}`, Buffer.from('new'))
      expect(res.status, name).toBe(409)
      expect(JSON.parse(res.body)).toEqual({ error: `${name} já existe na pasta de upload` })
    }
    expect(readFileSync(join(dir, 'a.mkv'), 'utf8')).toBe('old')
    expect(readFileSync(join(dir, 'b.mkv.part'), 'utf8')).toBe('sending')
    expect(existsSync(join(dir, 'b.mkv'))).toBe(false)
  })

  it('a declared size over 20 GB returns 413', async () => {
    const dir = await withUploads()
    const status = await new Promise<{ code: number; body: string }>((resolve, reject) => {
      const req = request(`${app!.url}/api/sonarr/uploads/big.mkv`, { method: 'PUT', headers: { 'Content-Length': '21474836481' } }, (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => resolve({ code: res.statusCode ?? 0, body }))
      })
      req.on('error', reject)
      req.write('x')
    })
    expect(status.code).toBe(413)
    expect(JSON.parse(status.body)).toEqual({ error: 'arquivo maior que 20 GB: 21474836481 bytes' })
    expect(readdirSync(dir)).toEqual([])
  })

  it('an aborted request leaves nothing in the folder', async () => {
    const dir = await withUploads()
    const req = request(`${app!.url}/api/sonarr/uploads/cut.mkv`, { method: 'PUT', headers: { 'Content-Length': '100000' } })
    req.on('error', () => undefined)
    req.write(Buffer.alloc(1000))
    await new Promise((resolve) => setTimeout(resolve, 50))
    req.destroy()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(readdirSync(dir)).toEqual([])
  })

  it('list returns plain files newest first without part files', async () => {
    const dir = await withUploads()
    writeFileSync(join(dir, 'old.mkv'), 'old')
    utimesSync(join(dir, 'old.mkv'), new Date('2026-01-01T00:00:00Z'), new Date('2026-01-01T00:00:00Z'))
    writeFileSync(join(dir, 'new.mkv'), 'newer')
    writeFileSync(join(dir, 'skip.mkv.part'), 'x')
    mkdirSync(join(dir, 'sub'))
    const res = await callApp(app!, 'GET', '/api/sonarr/uploads')
    expect(res.status).toBe(200)
    const listed = JSON.parse(res.body)
    expect(listed.map((file: { name: string; size: number }) => [file.name, file.size])).toEqual([['new.mkv', 5], ['old.mkv', 3]])
    expect(listed[1].modifiedAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('delete removes the file or answers 404', async () => {
    const dir = await withUploads()
    writeFileSync(join(dir, 'a.mkv'), 'x')
    expect((await callApp(app!, 'DELETE', '/api/sonarr/uploads/a.mkv')).status).toBe(204)
    expect(existsSync(join(dir, 'a.mkv'))).toBe(false)
    const missing = await callApp(app!, 'DELETE', '/api/sonarr/uploads/a.mkv')
    expect(missing.status).toBe(404)
    expect(JSON.parse(missing.body)).toEqual({ error: 'a.mkv não está na pasta de upload' })
  })
})
