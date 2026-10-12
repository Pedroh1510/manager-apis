import type { Request, Response } from 'express'
import type { JsonLogger } from '../logger.js'
import { SonarrGatewayError, SonarrNotFoundError, SonarrReleaseExpiredError, SonarrSeasonNotFoundError } from './sonarrGateway.js'
import { InvalidInputError } from './sonarrInput.js'

const NOT_FOUND_ERRORS = [SonarrNotFoundError, SonarrSeasonNotFoundError, SonarrReleaseExpiredError]

/**
 * Runs a Sonarr route body and maps its errors: 400 bad input, 404 missing thing, 502 Sonarr failure.
 * @example router.get('/series', (req, res) => respondSonarr(req, res, logger, async () => ...))
 */
export async function respondSonarr(req: Request, res: Response, logger: JsonLogger, send: () => Promise<void>): Promise<void> {
  try {
    await send()
  } catch (error: unknown) {
    if (error instanceof InvalidInputError) return void res.status(400).json({ error: error.message })
    if (NOT_FOUND_ERRORS.some((type) => error instanceof type)) return void res.status(404).json({ error: (error as Error).message })
    if (!(error instanceof SonarrGatewayError)) throw error
    logger.error('sonarr request failed', { path: req.originalUrl, reason: error.message })
    res.status(502).json({ error: error.message })
  }
}
