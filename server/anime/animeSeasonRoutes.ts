import { Router, type Request, type Response } from 'express'
import type { JsonLogger } from '../logger.js'
import { AnimeSeasonGatewayError, type AnimeSeasonGateway } from './anilistGateway.js'
import { SeasonInputError, parseAnimeType, parseSeasonQuery } from './animeSeasonInput.js'
import type { AnimeSeasonList } from './animeSeasonTypes.js'

/**
 * `/api/anime/seasons/*`, read-only: 400 on bad input, 502 when the upstream fails.
 * @example app.use('/api/anime', createAnimeSeasonRoutes(gateway, logger))
 */
export function createAnimeSeasonRoutes(gateway: AnimeSeasonGateway, logger: JsonLogger): Router {
  const router = Router()
  router.get('/seasons/upcoming', (req, res) => respondSeason(req, res, logger, () => gateway.readUpcoming(parseAnimeType(req.query.type))))
  router.get('/seasons/:year/:season', (req, res) => respondSeason(req, res, logger, () => {
    const query = parseSeasonQuery(req.params, req.query, new Date())
    if (query.kind === 'upcoming') return gateway.readUpcoming(query.type)
    return gateway.readSeason(query.year, query.season, query.type)
  }))
  return router
}

async function respondSeason(req: Request, res: Response, logger: JsonLogger, load: () => Promise<AnimeSeasonList>): Promise<void> {
  try {
    res.json(await load())
  } catch (error: unknown) {
    if (error instanceof SeasonInputError) return void res.status(400).json({ error: error.message })
    if (!(error instanceof AnimeSeasonGatewayError)) throw error
    logger.error('anime season request failed', { path: req.originalUrl, reason: error.message })
    res.status(502).json({ error: error.message })
  }
}
