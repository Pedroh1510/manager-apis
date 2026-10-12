import type { TdarrConfig } from '../config.js'
import { toTdarrNodes, type RawTdarrNode, type TdarrOverview } from './tdarrNodes.js'
import {
  toTdarrErrorFile,
  toTdarrStats,
  type RawTdarrLibrary,
  type RawTdarrStatistics,
  type RawTdarrStatusTableFile,
  type TdarrErrorDateField,
  type TdarrErrorList,
  type TdarrStats,
} from './tdarrStats.js'

/** What the routes need from Tdarr; the fake in server/test implements it too. Read-only (decision Q2). */
export interface TdarrGateway {
  readOverview(): Promise<TdarrOverview>
  readStats(): Promise<TdarrStats>
}

/** Any Tdarr failure, with a message safe to return to the browser. */
export class TdarrGatewayError extends Error {}

export const TDARR_TIMEOUT_MS = 10000
/** Newest 50 per error list (decision Q12). */
export const TDARR_ERROR_PAGE_SIZE = 50

const HTTP_UNAUTHORIZED = 401

type Clock = () => Date

/** The two error tables: 3 = transcode error/cancelled, 6 = health check error. */
const ERROR_TABLES: Record<keyof TdarrStats['errors'], { table: string; dateField: TdarrErrorDateField }> = {
  transcode: { table: 'table3', dateField: 'lastTranscodeDate' },
  healthCheck: { table: 'table6', dateField: 'lastHealthCheckDate' },
}

/**
 * The only body this app sends to `status-tables`. The same endpoint bulk-updates files when
 * `opts` carries `setAll`/`updatedObj`, and `pageSize: 0` returns every row - so nothing here is
 * caller-supplied (door 2).
 * @example statusTablesBody('transcode').data.opts // { table: 'table3' }
 */
export function statusTablesBody(list: keyof TdarrStats['errors']) {
  const { table, dateField } = ERROR_TABLES[list]
  return { data: { start: 0, pageSize: TDARR_ERROR_PAGE_SIZE, filters: [], sorts: [{ id: dateField, desc: true }], opts: { table } } }
}

const getAllBody = (collection: string) => ({ data: { collection, mode: 'getAll' } })

/**
 * Tdarr API v2 over native fetch; the key, when set, goes in `x-api-key`.
 * @example const overview = await new FetchTdarrGateway(config.tdarr).readOverview()
 */
export class FetchTdarrGateway implements TdarrGateway {
  constructor(
    private readonly config: TdarrConfig,
    readonly timeoutMs = TDARR_TIMEOUT_MS,
    private readonly now: Clock = () => new Date(),
  ) {}

  async readOverview(): Promise<TdarrOverview> {
    const status = await this.call<{ version: string }>('GET', '/status')
    const nodes = await this.call<Record<string, RawTdarrNode>>('GET', '/get-nodes')
    return { version: status.version, nodes: toTdarrNodes(nodes, this.now().getTime()) }
  }

  async readStats(): Promise<TdarrStats> {
    const [statistics] = await this.call<RawTdarrStatistics[]>('POST', '/cruddb', getAllBody('StatisticsJSONDB'))
    const libraries = await this.call<RawTdarrLibrary[]>('POST', '/cruddb', getAllBody('LibrarySettingsJSONDB'))
    const transcode = await this.readErrorList('transcode', libraries)
    const healthCheck = await this.readErrorList('healthCheck', libraries)
    return toTdarrStats(statistics, { transcode, healthCheck })
  }

  private async readErrorList(list: keyof TdarrStats['errors'], libraries: RawTdarrLibrary[]): Promise<TdarrErrorList> {
    const page = await this.call<{ array: RawTdarrStatusTableFile[]; totalCount: number }>('POST', '/client/status-tables', statusTablesBody(list))
    const { dateField } = ERROR_TABLES[list]
    return { total: page.totalCount, items: page.array.map((row) => toTdarrErrorFile(row, dateField, libraries)) }
  }

  private async call<T>(method: 'GET' | 'POST', path: string, body?: object): Promise<T> {
    const res = await this.fetchOrFail(method, path, body)
    if (res.status === HTTP_UNAUTHORIZED) throw new TdarrGatewayError('Tdarr recusou a API key (TDARR_API_KEY)')
    if (!res.ok) throw this.unavailable(`HTTP ${res.status} em /api/v2${path}`)
    try {
      return (await res.json()) as T
    } catch {
      throw this.unavailable(`resposta não é JSON em /api/v2${path}`)
    }
  }

  private async fetchOrFail(method: string, path: string, body?: object): Promise<Response> {
    const headers: Record<string, string> = {}
    if (this.config.apiKey) headers['x-api-key'] = this.config.apiKey
    if (body) headers['Content-Type'] = 'application/json'
    try {
      return await fetch(`${this.config.url.replace(/\/$/, '')}/api/v2${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (error: unknown) {
      throw this.unavailable(error instanceof Error ? error.message : String(error))
    }
  }

  private unavailable(reason: string): TdarrGatewayError {
    return new TdarrGatewayError(`Tdarr indisponível em ${this.config.url}: ${reason}`)
  }
}
