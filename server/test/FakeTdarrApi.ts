import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { RawTdarrNode } from '../tdarr/tdarrNodes.js'
import type { RawTdarrLibrary, RawTdarrStatistics, RawTdarrStatusTableFile } from '../tdarr/tdarrStats.js'

export interface FakeTdarrOptions {
  version?: string
  nodes?: Record<string, RawTdarrNode>
  statistics?: RawTdarrStatistics
  libraries?: RawTdarrLibrary[]
  /** `status-tables` answer per table (`table3`, `table6`). */
  tables?: Record<string, { array: RawTdarrStatusTableFile[]; totalCount: number }>
  /** Answer every request with this status instead of data. */
  failStatus?: number
  /** Answer every request with a body that is not JSON. */
  brokenJson?: boolean
  delayMs?: number
}

export interface RecordedTdarrRequest {
  method: string
  url: string
  apiKey: string | undefined
  body: unknown
}

const EMPTY_STATISTICS: RawTdarrStatistics = {
  totalFileCount: 0, totalTranscodeCount: 0, totalHealthCheckCount: 0, sizeDiff: 0,
  table0Count: 0, table1Count: 0, table2Count: 0, table3Count: 0, table4Count: 0, table5Count: 0, table6Count: 0,
}

/**
 * Local stand-in for Tdarr's API v2, enough for the real fetch gateway; records every request.
 * @example const tdarr = await FakeTdarrApi.start({ nodes: { a: node } })
 */
export class FakeTdarrApi {
  readonly requests: RecordedTdarrRequest[] = []

  private constructor(private readonly server: Server, private readonly options: FakeTdarrOptions) {}

  static async start(options: FakeTdarrOptions = {}): Promise<FakeTdarrApi> {
    // Requests only arrive after listen(), when `fake` is already initialised.
    const server = createServer((req, res) => void fake.handle(req, res))
    const fake = new FakeTdarrApi(server, options)
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
    const body = await readJsonBody(req)
    this.requests.push({ method: req.method ?? 'GET', url: req.url ?? '', apiKey: req.headers['x-api-key'] as string | undefined, body })
    if (this.options.delayMs) await new Promise((resolve) => setTimeout(resolve, this.options.delayMs))
    if (this.options.failStatus) return void res.writeHead(this.options.failStatus).end('fail')
    if (this.options.brokenJson) return void res.writeHead(200, { 'Content-Type': 'text/html' }).end('<html>')
    const data = this.route(`${req.method} ${req.url}`, body)
    if (data === undefined) return void res.writeHead(404).end('Not Found')
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(data))
  }

  private route(call: string, body: unknown): unknown {
    if (call === 'GET /api/v2/status') return { status: 'good', version: this.options.version ?? '2.94.02' }
    if (call === 'GET /api/v2/get-nodes') return this.options.nodes ?? {}
    if (call === 'POST /api/v2/cruddb') return this.crud(body)
    if (call === 'POST /api/v2/client/status-tables') return this.statusTable(body)
    return undefined
  }

  private crud(body: unknown): unknown {
    const collection = (body as { data?: { collection?: string } })?.data?.collection
    if (collection === 'StatisticsJSONDB') return [{ _id: 'statistics', ...(this.options.statistics ?? EMPTY_STATISTICS) }]
    if (collection === 'LibrarySettingsJSONDB') return this.options.libraries ?? []
    return undefined
  }

  private statusTable(body: unknown): unknown {
    const table = (body as { data?: { opts?: { table?: string } } })?.data?.opts?.table ?? ''
    return this.options.tables?.[table] ?? { array: [], totalCount: 0 }
  }
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return undefined
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
