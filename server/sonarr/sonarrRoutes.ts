import { Router, type Request, type Response } from 'express'
import type { JsonLogger } from '../logger.js'
import { registerSonarrActionRoutes } from './sonarrActionRoutes.js'
import { registerSonarrCalendarRoutes } from './sonarrCalendarRoutes.js'
import { registerSonarrImportRoutes } from './sonarrImportRoutes.js'
import { registerSonarrLibraryRoutes } from './sonarrLibraryRoutes.js'
import type { SonarrGateway } from './sonarrGateway.js'
import { parseSeriesId } from './sonarrInput.js'
import { respondSonarr } from './sonarrRespond.js'

const NOT_CONFIGURED = 'Sonarr não configurado (SONARR_URL ausente)'
const POSTER_CACHE = 'max-age=86400'

/**
 * `/api/sonarr/*`: 503 when the integration is off, 400/404 for bad input or a missing series,
 * 502 when Sonarr fails. Write routes live in sonarrActionRoutes.ts, sonarrLibraryRoutes.ts and sonarrImportRoutes.ts;
 * the week calendar in sonarrCalendarRoutes.ts.
 * `uploadDir` is SONARR_UPLOAD_DIR, or null when uploads are off.
 * @example app.use('/api/sonarr', createSonarrRoutes(gateway, logger, '/downloads/manual'))
 */
export function createSonarrRoutes(gateway: SonarrGateway | null, logger: JsonLogger, uploadDir: string | null = null): Router {
  const router = Router()
  if (!gateway) {
    router.use((_req, res) => void res.status(503).json({ error: NOT_CONFIGURED }))
    return router
  }
  const run = (req: Request, res: Response, send: () => Promise<void>) => respondSonarr(req, res, logger, send)
  router.get('/status', (req, res) => run(req, res, async () => void res.json(await gateway.readStatus())))
  router.get('/series', (req, res) => run(req, res, async () => void res.json(await gateway.listSeries())))
  router.get('/series/:id', (req, res) => run(req, res, async () => {
    res.json(await gateway.getSeriesDetail(parseSeriesId(req.params.id)))
  }))
  router.get('/series/:id/poster', (req, res) => run(req, res, async () => {
    const poster = await gateway.getPoster(parseSeriesId(req.params.id))
    res.set({ 'Content-Type': poster.contentType, 'Cache-Control': POSTER_CACHE }).send(Buffer.from(poster.bytes))
  }))
  registerSonarrActionRoutes(router, gateway, run)
  registerSonarrLibraryRoutes(router, gateway, run)
  registerSonarrImportRoutes(router, gateway, run, uploadDir)
  registerSonarrCalendarRoutes(router, gateway, run)
  return router
}
