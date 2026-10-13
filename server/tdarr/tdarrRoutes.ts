import { Router, type Request, type Response } from 'express'
import type { JsonLogger } from '../logger.js'
import { TdarrGatewayError, type TdarrGateway } from './tdarrGateway.js'

const NOT_CONFIGURED = 'Tdarr não configurado (TDARR_URL ausente)'

/**
 * `/api/tdarr/*`, read-only: 503 when the integration is off, 502 when Tdarr fails (door 4).
 * @example app.use('/api/tdarr', createTdarrRoutes(gateway, logger))
 */
export function createTdarrRoutes(gateway: TdarrGateway | null, logger: JsonLogger): Router {
  const router = Router()
  if (!gateway) {
    router.use((_req, res) => void res.status(503).json({ error: NOT_CONFIGURED }))
    return router
  }
  router.get('/overview', (req, res) => respondTdarr(req, res, logger, () => gateway.readOverview()))
  router.get('/stats', (req, res) => respondTdarr(req, res, logger, () => gateway.readStats()))
  return router
}

async function respondTdarr(req: Request, res: Response, logger: JsonLogger, load: () => Promise<object>): Promise<void> {
  try {
    res.json(await load())
  } catch (error: unknown) {
    if (!(error instanceof TdarrGatewayError)) throw error
    logger.error('tdarr request failed', { path: req.originalUrl, reason: error.message })
    res.status(502).json({ error: error.message })
  }
}
