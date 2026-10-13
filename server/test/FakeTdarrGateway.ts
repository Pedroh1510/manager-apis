import { TdarrGatewayError, type TdarrGateway } from '../tdarr/tdarrGateway.js'
import type { TdarrOverview } from '../tdarr/tdarrNodes.js'
import type { TdarrStats } from '../tdarr/tdarrStats.js'

const EMPTY_STATS: TdarrStats = {
  totals: { files: 0, transcodes: 0, healthChecks: 0, spaceSavedGb: 0 },
  transcode: { onHold: 0, queued: 0, succeeded: 0, failed: 0 },
  healthCheck: { queued: 0, succeeded: 0, failed: 0 },
  errors: { transcode: { total: 0, items: [] }, healthCheck: { total: 0, items: [] } },
}

/**
 * In-memory gateway for route tests; `failWith` makes every call reject like the real one does.
 * @example new FakeTdarrGateway({ overview: { version: '2.94.02', nodes: [] } })
 */
export class FakeTdarrGateway implements TdarrGateway {
  constructor(private readonly data: { overview?: TdarrOverview; stats?: TdarrStats; failWith?: string } = {}) {}

  async readOverview(): Promise<TdarrOverview> {
    this.throwIfFailing()
    return this.data.overview ?? { version: '2.94.02', nodes: [] }
  }

  async readStats(): Promise<TdarrStats> {
    this.throwIfFailing()
    return this.data.stats ?? EMPTY_STATS
  }

  private throwIfFailing(): void {
    if (this.data.failWith) throw new TdarrGatewayError(this.data.failWith)
  }
}
