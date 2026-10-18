import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { RawAniListMedia } from '../anime/anilistMedia.js'

/** One scripted answer, served before the regular pages (for retries and failures). */
export interface FakeAniListAnswer {
  status?: number
  headers?: Record<string, string>
  /** Sent as-is instead of JSON. */
  rawBody?: string
  json?: unknown
  delayMs?: number
}

export interface FakeAniListOptions {
  /** Page N answers `pages[N - 1]`; `hasNextPage` is true while another page follows. */
  pages?: RawAniListMedia[][]
  /** Every page says `hasNextPage: true`, to hit the page cap. */
  endless?: boolean
}

export interface RecordedAniListRequest {
  method: string
  path: string
  query: string
  variables: Record<string, unknown>
}

/**
 * Local stand-in for AniList's GraphQL endpoint, enough for the real gateway; records every request.
 * @example const anilist = await FakeAniListApi.start({ pages: [anilistMediaRange(1, 50), anilistMediaRange(51, 10)] })
 */
export class FakeAniListApi {
  readonly requests: RecordedAniListRequest[] = []
  private readonly scripted: FakeAniListAnswer[] = []

  private constructor(private readonly server: Server, private readonly options: FakeAniListOptions) {}

  static async start(options: FakeAniListOptions = {}): Promise<FakeAniListApi> {
    // Requests only arrive after listen(), when `fake` is already initialised.
    const server = createServer((req, res) => void fake.handle(req, res))
    const fake = new FakeAniListApi(server, options)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    return fake
  }

  get url(): string {
    return `http://127.0.0.1:${(this.server.address() as AddressInfo).port}/`
  }

  /** Queues answers for the next requests, in order; afterwards the regular pages answer. */
  script(...answers: FakeAniListAnswer[]): void {
    this.scripted.push(...answers)
  }

  close(): Promise<void> {
    this.server.closeAllConnections()
    return new Promise((resolve) => this.server.close(() => resolve()))
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = await readJsonBody(req)
    const variables = body.variables ?? {}
    this.requests.push({ method: req.method ?? 'GET', path: req.url ?? '', query: body.query ?? '', variables })
    const answer = this.scripted.shift() ?? { json: this.page(Number(variables.page ?? 1)) }
    if (answer.delayMs) await new Promise((resolve) => setTimeout(resolve, answer.delayMs))
    if (res.destroyed) return
    const headers = { 'Content-Type': answer.rawBody === undefined ? 'application/json' : 'text/html', ...answer.headers }
    res.writeHead(answer.status ?? 200, headers).end(answer.rawBody ?? JSON.stringify(answer.json))
  }

  private page(number: number): unknown {
    const pages = this.options.pages ?? [[]]
    const hasNextPage = this.options.endless === true || number < pages.length
    return { data: { Page: { pageInfo: { hasNextPage }, media: pages[number - 1] ?? [] } } }
  }
}

async function readJsonBody(req: IncomingMessage): Promise<{ query?: string; variables?: Record<string, unknown> }> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
}
