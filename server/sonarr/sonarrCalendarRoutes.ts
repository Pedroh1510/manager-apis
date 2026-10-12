import type { Request, Response, Router } from 'express'
import type { SonarrGateway } from './sonarrGateway.js'
import { parseCalendarWindow } from './sonarrCalendarInput.js'

type Run = (req: Request, res: Response, send: () => Promise<void>) => Promise<void>

/**
 * The week calendar; same error mapping as the other routes.
 * @example registerSonarrCalendarRoutes(router, gateway, run)
 */
export function registerSonarrCalendarRoutes(router: Router, gateway: SonarrGateway, run: Run): void {
  router.get('/calendar', (req, res) => run(req, res, async () => {
    res.json(await gateway.listCalendar(parseCalendarWindow(req.query)))
  }))
}
