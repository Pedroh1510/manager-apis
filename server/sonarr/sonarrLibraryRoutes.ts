import type { Request, Response, Router } from 'express'
import type { SonarrGateway } from './sonarrGateway.js'
import { parseAddSeriesBody, parseEpisodeIdsBody, parseLookupTerm, parseMissingPage } from './sonarrLibraryInput.js'

type Run = (req: Request, res: Response, send: () => Promise<void>) => Promise<void>

/**
 * Adding series and the missing-episodes screen (PR 3b); same error mapping as the other routes.
 * @example registerSonarrLibraryRoutes(router, gateway, run)
 */
export function registerSonarrLibraryRoutes(router: Router, gateway: SonarrGateway, run: Run): void {
  router.get('/lookup', (req, res) => run(req, res, async () => {
    res.json(await gateway.lookupSeries(parseLookupTerm(req.query.term)))
  }))
  router.get('/add-options', (req, res) => run(req, res, async () => void res.json(await gateway.readAddOptions())))
  router.post('/series', (req, res) => run(req, res, async () => {
    const id = await gateway.addSeries(parseAddSeriesBody(req.body))
    res.status(201).json({ id })
  }))
  router.get('/missing', (req, res) => run(req, res, async () => {
    res.json(await gateway.listMissing(parseMissingPage(req.query.page)))
  }))
  router.post('/episodes/search', (req, res) => run(req, res, async () => {
    await gateway.searchEpisodes(parseEpisodeIdsBody(req.body))
    res.status(202).end()
  }))
  router.post('/missing/search', (req, res) => run(req, res, async () => {
    await gateway.searchAllMissing()
    res.status(202).end()
  }))
}
