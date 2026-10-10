import { Router, type Request, type Response } from 'express'
import type { JsonLogger } from '../logger.js'
import { SonarrGatewayError, SonarrNotFoundError, type SonarrGateway } from './sonarrGateway.js'

const NOT_CONFIGURED = 'Sonarr não configurado (SONARR_URL ausente)'
const POSTER_CACHE = 'max-age=86400'

/**
 * `/api/sonarr/*`: 503 when the integration is off, 400/404 for a bad or unknown series id,
 * 502 when Sonarr fails.
 * @example app.use('/api/sonarr', createSonarrRoutes(gateway, logger))
 */
export function createSonarrRoutes(gateway: SonarrGateway | null, logger: JsonLogger): Router {
  const router = Router()
  if (!gateway) {
    router.use((_req, res) => void res.status(503).json({ error: NOT_CONFIGURED }))
    return router
  }
  const run = (req: Request, res: Response, send: () => Promise<void>) => respond(req, res, logger, send)
  router.get('/status', (req, res) => run(req, res, async () => void res.json(await gateway.readStatus())))
  router.get('/series', (req, res) => run(req, res, async () => void res.json(await gateway.listSeries())))
  router.get('/series/:id', (req, res) => run(req, res, async () => {
    res.json(await gateway.getSeriesDetail(parseSeriesId(req.params.id)))
  }))
  router.get('/series/:id/poster', (req, res) => run(req, res, async () => {
    const poster = await gateway.getPoster(parseSeriesId(req.params.id))
    res.set({ 'Content-Type': poster.contentType, 'Cache-Control': POSTER_CACHE }).send(Buffer.from(poster.bytes))
  }))
  return router
}

class InvalidSeriesIdError extends Error {}

function parseSeriesId(raw: string): number {
  const id = Number(raw)
  if (Number.isInteger(id) && id > 0) return id
  throw new InvalidSeriesIdError(`id de série inválido: "${raw}", esperado inteiro positivo`)
}

async function respond(req: Request, res: Response, logger: JsonLogger, send: () => Promise<void>): Promise<void> {
  try {
    await send()
  } catch (error: unknown) {
    if (error instanceof InvalidSeriesIdError) return void res.status(400).json({ error: error.message })
    if (error instanceof SonarrNotFoundError) return void res.status(404).json({ error: error.message })
    if (!(error instanceof SonarrGatewayError)) throw error
    logger.error('sonarr request failed', { path: req.originalUrl, reason: error.message })
    res.status(502).json({ error: error.message })
  }
}
