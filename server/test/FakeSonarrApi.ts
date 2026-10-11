import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { RawMissingPage } from '../sonarr/missingEpisodes.js'
import type { RawEpisode, RawSeries } from '../sonarr/seriesDetail.js'
import type { RawLookupSeries } from '../sonarr/seriesLookup.js'

export interface FakeSonarrOptions {
  series?: RawSeries[]
  episodes?: RawEpisode[]
  /** seriesId -> poster-500.jpg bytes */
  posters?: Record<number, Buffer>
  health?: { type: string; message: string; source?: string }[]
  queueTotal?: number
  rootFolders?: { path: string; freeSpace: number }[]
  releases?: unknown[]
  /** Status for POST /release; 404 simulates a release that left Sonarr's cache. */
  grabStatus?: number
  /** Every `/series/lookup` answer; a `tvdb:<id>` term narrows it to that id. */
  lookup?: RawLookupSeries[]
  qualityProfiles?: unknown[]
  missing?: RawMissingPage
  /** Status and body for POST /series (default 201 echoing the request). */
  addStatus?: number
  addResponse?: unknown
  /** Answer every request with this status instead of data. */
  failStatus?: number
  delayMs?: number
}

export interface RecordedSonarrRequest {
  method: string
  url: string
  apiKey: string | undefined
  body: unknown
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

  /** Writes only, in order: what the gateway asked Sonarr to change. */
  get writes(): RecordedSonarrRequest[] {
    return this.requests.filter((request) => request.method !== 'GET')
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = await readJsonBody(req)
    this.requests.push({ method: req.method ?? 'GET', url: req.url ?? '', apiKey: req.headers['x-api-key'] as string | undefined, body })
    if (this.options.delayMs) await new Promise((resolve) => setTimeout(resolve, this.options.delayMs))
    if (this.options.failStatus) return void res.writeHead(this.options.failStatus).end('fail')
    const url = new URL(req.url ?? '/', 'http://fake')
    if (req.method !== 'GET') return this.answerWrite(req.method ?? '', url.pathname, body, res)
    const poster = url.pathname.match(/^\/api\/v3\/mediacover\/(\d+)\/poster-500\.jpg$/)
    if (poster) return this.sendPoster(Number(poster[1]), res)
    const data = this.route(url)
    if (data === undefined) return void res.writeHead(404).end('Not Found')
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(data))
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
      '/api/v3/release': this.options.releases ?? [],
      '/api/v3/series/lookup': this.lookup(url.searchParams.get('term') ?? ''),
      '/api/v3/qualityprofile': this.options.qualityProfiles ?? [],
      '/api/v3/wanted/missing': this.options.missing ?? { page: 1, pageSize: 20, totalRecords: 0, records: [] },
      // One series per fake: every episode belongs to whichever seriesId is asked.
      '/api/v3/episode': url.searchParams.has('seriesId') ? episodes : [],
    }
    return routes[url.pathname]
  }

  private lookup(term: string): RawLookupSeries[] {
    const all = this.options.lookup ?? []
    const tvdb = term.match(/^tvdb:(\d+)$/)
    return tvdb ? all.filter((series) => series.tvdbId === Number(tvdb[1])) : all
  }

  private answerWrite(method: string, path: string, body: unknown, res: ServerResponse): void {
    if (method === 'POST' && path === '/api/v3/release') return void res.writeHead(this.options.grabStatus ?? 200).end('{}')
    if (method === 'POST' && path === '/api/v3/series') {
      const answer = JSON.stringify(this.options.addResponse ?? body ?? {})
      return void res.writeHead(this.options.addStatus ?? 201, { 'Content-Type': 'application/json' }).end(answer)
    }
    const statuses: Record<string, number> = { 'PUT /api/v3/episode/monitor': 202, 'POST /api/v3/command': 201 }
    const isSeriesPut = method === 'PUT' && /^\/api\/v3\/series\/\d+$/.test(path)
    const status = isSeriesPut ? 202 : statuses[`${method} ${path}`]
    if (!status) return void res.writeHead(404).end('Not Found')
    res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body ?? {}))
  }

  private sendPoster(seriesId: number, res: ServerResponse): void {
    const bytes = this.options.posters?.[seriesId]
    if (!bytes) return void res.writeHead(404).end('Not Found')
    res.writeHead(200, { 'Content-Type': 'image/jpeg' }).end(bytes)
  }
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const text = Buffer.concat(chunks).toString()
  return text ? JSON.parse(text) : undefined
}
