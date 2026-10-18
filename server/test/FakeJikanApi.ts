import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { RawJikanAnime } from '../jikan/jikanSeasonItems.js'

/** One scripted answer, served before the regular pages (for retries and failures). */
export interface FakeJikanAnswer {
  status?: number
  headers?: Record<string, string>
  /** Sent as-is instead of JSON. */
  rawBody?: string
  json?: unknown
  delayMs?: number
}

export interface FakeJikanOptions {
  /** Page N answers `pages[N - 1]`; `has_next_page` is true while another page follows. */
  pages?: RawJikanAnime[][]
  /** Every page says `has_next_page: true`, to hit the page cap. */
  endless?: boolean
}

export interface RecordedJikanRequest {
  path: string
  query: Record<string, string>
}

/**
 * Local stand-in for Jikan v4 season endpoints, enough for the real fetch gateway; records every request.
 * @example const jikan = await FakeJikanApi.start({ pages: [jikanAnimeRange(1, 25), jikanAnimeRange(26, 10)] })
 */
export class FakeJikanApi {
  readonly requests: RecordedJikanRequest[] = []
  private readonly scripted: FakeJikanAnswer[] = []

  private constructor(private readonly server: Server, private readonly options: FakeJikanOptions) {}

  static async start(options: FakeJikanOptions = {}): Promise<FakeJikanApi> {
    // Requests only arrive after listen(), when `fake` is already initialised.
    const server = createServer((req, res) => void fake.handle(req, res))
    const fake = new FakeJikanApi(server, options)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    return fake
  }

  get url(): string {
    return `http://127.0.0.1:${(this.server.address() as AddressInfo).port}/v4`
  }

  /** Queues answers for the next requests, in order; afterwards the regular pages answer. */
  script(...answers: FakeJikanAnswer[]): void {
    this.scripted.push(...answers)
  }

  close(): Promise<void> {
    this.server.closeAllConnections()
    return new Promise((resolve) => this.server.close(() => resolve()))
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://fake')
    const query = Object.fromEntries(url.searchParams)
    this.requests.push({ path: url.pathname, query })
    const answer = this.scripted.shift() ?? { json: this.page(Number(query.page ?? '1')) }
    if (answer.delayMs) await new Promise((resolve) => setTimeout(resolve, answer.delayMs))
    if (res.destroyed) return
    const headers = { 'Content-Type': answer.rawBody === undefined ? 'application/json' : 'text/html', ...answer.headers }
    res.writeHead(answer.status ?? 200, headers).end(answer.rawBody ?? JSON.stringify(answer.json))
  }

  private page(number: number): unknown {
    const pages = this.options.pages ?? [[]]
    const data = pages[number - 1] ?? []
    const hasNext = this.options.endless === true || number < pages.length
    return {
      pagination: { last_visible_page: pages.length, has_next_page: hasNext, current_page: number, items: { count: data.length, total: pages.flat().length, per_page: 25 } },
      data,
    }
  }
}
