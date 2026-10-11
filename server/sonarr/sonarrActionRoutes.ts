import type { Request, Response, Router } from 'express'
import type { SonarrGateway } from './sonarrGateway.js'
import {
  parseEpisodeId,
  parseEpisodesMonitorBody,
  parseGrabBody,
  parseMonitoredBody,
  parseReleaseQuery,
  parseSeasonNumber,
  parseSeriesId,
} from './sonarrInput.js'

type Run = (req: Request, res: Response, send: () => Promise<void>) => Promise<void>

/**
 * Writes and interactive search on top of the read routes; same 400/404/502 mapping.
 * @example registerSonarrActionRoutes(router, gateway, run)
 */
export function registerSonarrActionRoutes(router: Router, gateway: SonarrGateway, run: Run): void {
  router.put('/episodes/monitor', (req, res) => run(req, res, async () => {
    const { episodeIds, monitored } = parseEpisodesMonitorBody(req.body)
    await gateway.setEpisodesMonitored(episodeIds, monitored)
    res.status(204).end()
  }))
  router.put('/series/:id/seasons/:seasonNumber/monitor', (req, res) => run(req, res, async () => {
    const [seriesId, seasonNumber] = [parseSeriesId(req.params.id), parseSeasonNumber(req.params.seasonNumber)]
    await gateway.setSeasonMonitored(seriesId, seasonNumber, parseMonitoredBody(req.body))
    res.status(204).end()
  }))
  router.post('/episodes/:episodeId/search', (req, res) => run(req, res, async () => {
    await gateway.searchEpisode(parseEpisodeId(req.params.episodeId))
    res.status(202).end()
  }))
  router.post('/series/:id/seasons/:seasonNumber/search', (req, res) => run(req, res, async () => {
    await gateway.searchSeason(parseSeriesId(req.params.id), parseSeasonNumber(req.params.seasonNumber))
    res.status(202).end()
  }))
  router.get('/releases', (req, res) => run(req, res, async () => {
    res.json(await gateway.listReleases(parseReleaseQuery(req.query as Record<string, unknown>)))
  }))
  router.post('/releases', (req, res) => run(req, res, async () => {
    const { guid, indexerId } = parseGrabBody(req.body)
    await gateway.grabRelease(guid, indexerId)
    res.status(204).end()
  }))
}
