// @vitest-environment node
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PassThrough, Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { FsUploadStore, UploadExistsError, UploadTooLargeError } from './uploadStore.js'

const newDir = () => mkdtempSync(join(tmpdir(), 'upload-store-'))

describe('FsUploadStore', () => {
  it('writes to a part file and renames when the stream ends', async () => {
    const dir = newDir()
    const body = new PassThrough()
    const saving = new FsUploadStore(dir).save('Ep 07.mkv', body, null)
    body.write(Buffer.alloc(1000, 1))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(readdirSync(dir)).toEqual(['Ep 07.mkv.part'])

    body.end(Buffer.alloc(2000, 2))
    expect(await saving).toEqual({ name: 'Ep 07.mkv', size: 3000 })
    expect(readdirSync(dir)).toEqual(['Ep 07.mkv'])
    expect(readFileSync(join(dir, 'Ep 07.mkv')).length).toBe(3000)
  })

  it('a stream over the limit is refused and leaves nothing', async () => {
    const dir = newDir()
    const saving = new FsUploadStore(dir, 10).save('big.mkv', Readable.from([Buffer.alloc(6), Buffer.alloc(5)]), null)
    await expect(saving).rejects.toThrow(UploadTooLargeError)
    await expect(saving).rejects.toThrow('arquivo maior que 20 GB: 11 bytes')
    expect(readdirSync(dir)).toEqual([])
  })

  it('a broken stream removes the part file', async () => {
    const dir = newDir()
    const body = new PassThrough()
    const saving = new FsUploadStore(dir).save('x.mkv', body, null)
    body.write(Buffer.alloc(100))
    await new Promise((resolve) => setTimeout(resolve, 20))
    body.destroy(new Error('connection reset'))
    await expect(saving).rejects.toThrow('connection reset')
    expect(existsSync(join(dir, 'x.mkv'))).toBe(false)
    expect(existsSync(join(dir, 'x.mkv.part'))).toBe(false)
  })

  it('a name that appears mid-upload keeps the other file and removes our part', async () => {
    const dir = newDir()
    const body = new PassThrough()
    const saving = new FsUploadStore(dir).save('race.mkv', body, null)
    body.write(Buffer.alloc(100))
    await new Promise((resolve) => setTimeout(resolve, 20))
    writeFileSync(join(dir, 'race.mkv'), 'other upload won')
    body.end()
    await expect(saving).rejects.toThrow(UploadExistsError)
    expect(readdirSync(dir)).toEqual(['race.mkv'])
    expect(readFileSync(join(dir, 'race.mkv'), 'utf8')).toBe('other upload won')
  })
})
