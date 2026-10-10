import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { RawEpisode, RawSeries } from '../sonarr/seriesDetail.js'

export interface FakeSonarrOptions {
  series?: RawSeries[]
  episodes?: RawEpisode[]
  /** seriesId -> poster-500.jpg bytes */
  posters?: Record<number, Buffer>
  health?: { type: string; message: string; source?: string }[]
  queueTotal?: number
  rootFolders?: { path: string; freeSpace: number }[]
  /** Answer every request with this status instead of data. */
  failStatus?: number
  delayMs?: number
}

export interface RecordedSonarrRequest {
  url: string
  apiKey: string | undefined
}

/**
 * Local stand-in for Sonarr's API v3, enough for the real fetch gateway.
 * @example const sonarr = await FakeSonarrApi.start({ series: [wire] })
 */
export class FakeSonarrApi {
  readonly requests: RecordedSonarrRequest[] = []

  private constructor(private readonly server: Server, private readonly options: FakeSonarrOptions) {}

  static async start(options: FakeSonarrOptions = {}): Promise<FakeSonarrApi> {
    // Requests only arrive after listen(), when `fake` is already initialised.
    const server = createServer((req, res) => void fake.handle(req, res))
    const fake = new FakeSonarrApi(server, options)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    return fake
  }

  get url(): string {
    return `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`
  }

  close(): Promise<void> {
    this.server.closeAllConnections()
    return new Promise((resolve) => this.server.close(() => resolve()))
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    this.requests.push({ url: req.url ?? '', apiKey: req.headers['x-api-key'] as string | undefined })
    if (this.options.delayMs) await new Promise((resolve) => setTimeout(resolve, this.options.delayMs))
    if (this.options.failStatus) return void res.writeHead(this.options.failStatus).end('fail')
    const url = new URL(req.url ?? '/', 'http://fake')
    const poster = url.pathname.match(/^\/api\/v3\/mediacover\/(\d+)\/poster-500\.jpg$/)
    if (poster) return this.sendPoster(Number(poster[1]), res)
    const body = this.route(url)
    if (body === undefined) return void res.writeHead(404).end('Not Found')
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
  }

  private route(url: URL): unknown {
    const { series = [], episodes = [] } = this.options
    const one = url.pathname.match(/^\/api\/v3\/series\/(\d+)$/)
    if (one) return series.find((item) => item.id === Number(one[1]))
    const routes: Record<string, unknown> = {
      '/api/v3/system/status': { version: '4.0.9.2244' },
      '/api/v3/health': this.options.health ?? [],
      '/api/v3/queue/status': { totalCount: this.options.queueTotal ?? 0 },
      '/api/v3/rootfolder': this.options.rootFolders ?? [],
      '/api/v3/series': series,
      // One series per fake: every episode belongs to whichever seriesId is asked.
      '/api/v3/episode': url.searchParams.has('seriesId') ? episodes : [],
    }
    return routes[url.pathname]
  }

  private sendPoster(seriesId: number, res: ServerResponse): void {
    const bytes = this.options.posters?.[seriesId]
    if (!bytes) return void res.writeHead(404).end('Not Found')
    res.writeHead(200, { 'Content-Type': 'image/jpeg' }).end(bytes)
  }
}
