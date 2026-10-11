import type { Request, Response } from 'express'
import type { JsonLogger } from '../logger.js'
import {
  SonarrGatewayError,
  SonarrLookupNotFoundError,
  SonarrNotFoundError,
  SonarrRejectedError,
  SonarrReleaseExpiredError,
  SonarrSeasonNotFoundError,
  SonarrSeriesExistsError,
} from './sonarrGateway.js'
import { InvalidInputError } from './sonarrInput.js'

const ERROR_STATUSES: [new (...args: never[]) => Error, number][] = [
  [InvalidInputError, 400],
  [SonarrNotFoundError, 404],
  [SonarrSeasonNotFoundError, 404],
  [SonarrReleaseExpiredError, 404],
  [SonarrLookupNotFoundError, 404],
  [SonarrSeriesExistsError, 409],
  [SonarrRejectedError, 422],
]

/**
 * Runs a Sonarr route body and maps its errors: 400 bad input, 404 missing thing, 409 duplicate,
 * 422 refused by Sonarr, 502 Sonarr failure.
 * @example router.get('/series', (req, res) => respondSonarr(req, res, logger, async () => ...))
 */
export async function respondSonarr(req: Request, res: Response, logger: JsonLogger, send: () => Promise<void>): Promise<void> {
  try {
    await send()
  } catch (error: unknown) {
    const mapped = ERROR_STATUSES.find(([type]) => error instanceof type)
    if (mapped) return void res.status(mapped[1]).json({ error: (error as Error).message })
    if (!(error instanceof SonarrGatewayError)) throw error
    logger.error('sonarr request failed', { path: req.originalUrl, reason: error.message })
    res.status(502).json({ error: error.message })
  }
}
