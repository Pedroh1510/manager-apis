import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import { join } from 'node:path'
import type { JsonLogger } from './logger.js'
import type { QbittorrentGateway } from './qbittorrent/qbittorrentGateway.js'
import { createQbittorrentRoutes } from './qbittorrent/qbittorrentRoutes.js'
import type { SonarrGateway } from './sonarr/sonarrGateway.js'
import { createSonarrRoutes } from './sonarr/sonarrRoutes.js'

export interface AppDeps {
  /** The `vite build` output served to the browser. */
  staticDir: string
  /** null when QBITTORRENT_URL is absent. */
  qbittorrent: QbittorrentGateway | null
  /** null when SONARR_URL is absent. */
  sonarr: SonarrGateway | null
  logger: JsonLogger
}

/**
 * The SPA and its `/api` on one origin; used by `server/index.ts` and by the tests alike.
 * @example createApp({ staticDir: 'dist', qbittorrent: null, sonarr: null, logger }).listen(3002)
 */
export function createApp(deps: AppDeps): Express {
  const app = express()
  app.get('/api/health', (_req, res) => void res.json({ status: 'ok' }))
  app.get('/api/config', (_req, res) => void res.json({ qbittorrent: deps.qbittorrent !== null, sonarr: deps.sonarr !== null }))
  app.use('/api', express.json())
  app.use('/api', rejectMalformedJson)
  app.use('/api/qbittorrent', createQbittorrentRoutes(deps.qbittorrent, deps.logger))
  app.use('/api/sonarr', createSonarrRoutes(deps.sonarr, deps.logger))
  app.use('/api', (req, res) => {
    const path = req.originalUrl.split('?')[0]
    res.status(404).json({ error: `rota não encontrada: ${req.method} ${path}` })
  })
  app.use(express.static(deps.staticDir))
  // React Router owns every other path, so they all get the same document.
  app.get('/{*spaPath}', (_req, res) => res.sendFile(join(deps.staticDir, 'index.html')))
  return app
}

/** express.json() raises a SyntaxError for a broken body; answer it in the API's own error shape. */
function rejectMalformedJson(error: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (error instanceof SyntaxError && 'body' in error) return void res.status(400).json({ error: 'corpo JSON inválido' })
  next(error)
}
