import { Router, type Request, type Response } from 'express'
import type { JsonLogger } from '../logger.js'
import { QbittorrentGatewayError, type QbittorrentGateway } from './qbittorrentGateway.js'
import { countTorrentGroups, summarizeTorrents } from './summarizeTorrents.js'

const NOT_CONFIGURED = 'qBittorrent não configurado (QBITTORRENT_URL ausente)'

/**
 * `/api/qbittorrent/*`: 503 when the integration is off, 502 when qBittorrent fails.
 * @example app.use('/api/qbittorrent', createQbittorrentRoutes(gateway, logger))
 */
export function createQbittorrentRoutes(gateway: QbittorrentGateway | null, logger: JsonLogger): Router {
  const router = Router()
  if (!gateway) {
    router.use((_req, res) => void res.status(503).json({ error: NOT_CONFIGURED }))
    return router
  }
  router.get('/torrents', async (req, res) => {
    await respond(req, res, logger, async () => summarizeTorrents(await gateway.listTorrents()))
  })
  router.get('/status', async (req, res) => {
    await respond(req, res, logger, async () => {
      const [status, torrents] = await Promise.all([gateway.readStatus(), gateway.listTorrents()])
      const { downloading, completed } = countTorrentGroups(torrents)
      return { ...status, downloading, completed }
    })
  })
  return router
}

async function respond(req: Request, res: Response, logger: JsonLogger, load: () => Promise<object>): Promise<void> {
  try {
    res.json(await load())
  } catch (error: unknown) {
    if (!(error instanceof QbittorrentGatewayError)) throw error
    logger.error('qbittorrent request failed', { path: req.originalUrl, reason: error.message })
    res.status(502).json({ error: error.message })
  }
}
