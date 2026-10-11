import { Router, type Request, type Response } from 'express'
import { InvalidUploadNameError, parseUploadName } from './uploadName.js'
import { UploadExistsError, UploadNotFoundError, UploadTooLargeError, type UploadStore } from './uploadStore.js'

export const UPLOAD_DISABLED = 'upload desligado (SONARR_UPLOAD_DIR ausente)'

const ERROR_STATUSES: [new (...args: never[]) => Error, number][] = [
  [InvalidUploadNameError, 400],
  [UploadNotFoundError, 404],
  [UploadExistsError, 409],
  [UploadTooLargeError, 413],
]

async function respondUpload(res: Response, send: () => Promise<void>): Promise<void> {
  try {
    await send()
  } catch (error: unknown) {
    const mapped = ERROR_STATUSES.find(([type]) => error instanceof type)
    if (!mapped) throw error
    // The client may still be sending the body; closing makes it stop instead of uploading 20 GB for nothing.
    res.status(mapped[1]).set('Connection', 'close').json({ error: (error as Error).message })
  }
}

function declaredSize(req: Request): number | null {
  const raw = req.headers['content-length']
  return raw === undefined ? null : Number(raw)
}

/**
 * `/api/sonarr/uploads`: raw-body PUT per file, list and delete, all inside SONARR_UPLOAD_DIR.
 * @example app.use('/api/sonarr/uploads', createUploadRoutes(store))
 */
export function createUploadRoutes(store: UploadStore | null): Router {
  const router = Router()
  if (!store) {
    router.use((_req, res) => void res.status(503).json({ error: UPLOAD_DISABLED }))
    return router
  }
  router.put('/:name', (req, res) => respondUpload(res, async () => {
    const name = parseUploadName(req.params.name)
    res.status(201).json(await store.save(name, req, declaredSize(req)))
  }))
  router.get('/', (_req, res) => respondUpload(res, async () => void res.json(await store.list())))
  router.delete('/:name', (req, res) => respondUpload(res, async () => {
    await store.remove(parseUploadName(req.params.name))
    res.status(204).end()
  }))
  return router
}
