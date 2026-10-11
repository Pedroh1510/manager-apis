import type { Request, Response, Router } from 'express'
import type { SonarrGateway } from './sonarrGateway.js'
import { parseCommandId, parseImportBody, parseImportFilesQuery } from './sonarrImportInput.js'

type Run = (req: Request, res: Response, send: () => Promise<void>) => Promise<void>

/**
 * Manual import from a stuck download (PR 4a) or the upload folder (PR 4b), and the command state the screen polls.
 * @example registerSonarrImportRoutes(router, gateway, run, '/downloads/manual')
 */
export function registerSonarrImportRoutes(router: Router, gateway: SonarrGateway, run: Run, uploadDir: string | null): void {
  router.get('/import/queue', (req, res) => run(req, res, async () => void res.json(await gateway.listStuckDownloads())))
  router.get('/import/files', (req, res) => run(req, res, async () => {
    res.json(await gateway.listImportFiles(parseImportFilesQuery(req.query as Record<string, unknown>, uploadDir)))
  }))
  router.post('/import', (req, res) => run(req, res, async () => {
    const { source, files } = parseImportBody(req.body, uploadDir)
    res.status(202).json({ commandId: await gateway.startManualImport(source, files) })
  }))
  router.get('/commands/:id', (req, res) => run(req, res, async () => {
    res.json(await gateway.readCommand(parseCommandId(req.params.id)))
  }))
}
