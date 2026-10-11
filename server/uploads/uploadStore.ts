import { createWriteStream } from 'node:fs'
import { link, readdir, stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { Transform, type Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

/** 20 GiB per file (decision Q6). */
export const MAX_UPLOAD_BYTES = 20 * 1024 ** 3

const PART_SUFFIX = '.part'

export interface StoredUpload {
  name: string
  size: number
}

export interface ListedUpload extends StoredUpload {
  /** ISO date of the last write. */
  modifiedAt: string
}

/** What the upload routes need from the disk; the folder is the only state. */
export interface UploadStore {
  readonly dir: string
  save(name: string, body: Readable, declaredSize: number | null): Promise<StoredUpload>
  list(): Promise<ListedUpload[]>
  remove(name: string): Promise<void>
}

/** The name, or its unfinished `.part`, is already in the folder (409). */
export class UploadExistsError extends Error {
  constructor(name: string) {
    super(`${name} já existe na pasta de upload`)
  }
}

/** Declared or streamed size over the limit (413). */
export class UploadTooLargeError extends Error {
  constructor(bytes: number) {
    super(`arquivo maior que 20 GB: ${bytes} bytes`)
  }
}

/** (404) */
export class UploadNotFoundError extends Error {
  constructor(name: string) {
    super(`${name} não está na pasta de upload`)
  }
}

const isErrorCode = (error: unknown, code: string) => (error as NodeJS.ErrnoException | null)?.code === code

/** Counts bytes and fails the pipeline as soon as the limit is passed. */
function sizeLimit(maxBytes: number): Transform {
  let received = 0
  return new Transform({
    transform(chunk: Buffer, _encoding, done) {
      received += chunk.length
      done(received > maxBytes ? new UploadTooLargeError(received) : null, chunk)
    },
  })
}

/**
 * Uploads on disk: each one streams into `<name>.part` and only becomes `<name>` when complete,
 * so Sonarr never sees half a file (door 1).
 * @example await new FsUploadStore('/downloads/manual').save('Ep 07.mkv', req, 3000)
 */
export class FsUploadStore implements UploadStore {
  constructor(
    readonly dir: string,
    private readonly maxBytes = MAX_UPLOAD_BYTES,
  ) {}

  async save(name: string, body: Readable, declaredSize: number | null): Promise<StoredUpload> {
    if (declaredSize !== null && declaredSize > this.maxBytes) throw new UploadTooLargeError(declaredSize)
    const [finalPath, partPath] = [join(this.dir, name), join(this.dir, name + PART_SUFFIX)]
    if (await this.exists(finalPath)) throw new UploadExistsError(name)
    // `wx` fails when the .part exists: a second upload of the same name never shares a file.
    const partFile = createWriteStream(partPath, { flags: 'wx' })
    let ownsPart = false
    partFile.once('open', () => (ownsPart = true))
    try {
      await pipeline(body, sizeLimit(this.maxBytes), partFile)
      await link(partPath, finalPath)
    } catch (error: unknown) {
      // Only our own .part is removed: another upload's .part, or the final name created meanwhile, stay.
      if (ownsPart) await unlink(partPath).catch(() => undefined)
      throw isErrorCode(error, 'EEXIST') ? new UploadExistsError(name) : error
    }
    await unlink(partPath)
    return { name, size: (await stat(finalPath)).size }
  }

  async list(): Promise<ListedUpload[]> {
    const entries = await readdir(this.dir, { withFileTypes: true })
    const files = entries.filter((entry) => entry.isFile() && !entry.name.endsWith(PART_SUFFIX))
    const listed = await Promise.all(files.map(async ({ name }) => {
      const info = await stat(join(this.dir, name))
      return { name, size: info.size, modifiedAt: info.mtime.toISOString() }
    }))
    return listed.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
  }

  async remove(name: string): Promise<void> {
    try {
      await unlink(join(this.dir, name))
    } catch (error: unknown) {
      throw isErrorCode(error, 'ENOENT') ? new UploadNotFoundError(name) : error
    }
  }

  private async exists(path: string): Promise<boolean> {
    return (await stat(path).catch(() => null)) !== null
  }
}
