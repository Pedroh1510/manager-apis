import type { Request, Response, Router } from 'express'
import type { SonarrGateway } from './sonarrGateway.js'
import { parseCommandId, parseDownloadId, parseImportBody } from './sonarrImportInput.js'

type Run = (req: Request, res: Response, send: () => Promise<void>) => Promise<void>

/**
 * Manual import of stuck downloads (PR 4a) and the command state the screen polls.
 * @example registerSonarrImportRoutes(router, gateway, run)
 */
export function registerSonarrImportRoutes(router: Router, gateway: SonarrGateway, run: Run): void {
  router.get('/import/queue', (req, res) => run(req, res, async () => void res.json(await gateway.listStuckDownloads())))
  router.get('/import/files', (req, res) => run(req, res, async () => {
    res.json(await gateway.listImportFiles(parseDownloadId(req.query.downloadId)))
  }))
  router.post('/import', (req, res) => run(req, res, async () => {
    const { downloadId, files } = parseImportBody(req.body)
    res.status(202).json({ commandId: await gateway.startManualImport(downloadId, files) })
  }))
  router.get('/commands/:id', (req, res) => run(req, res, async () => {
    res.json(await gateway.readCommand(parseCommandId(req.params.id)))
  }))
}
