import type { TdarrErrorList, TdarrNode, TdarrOverview, TdarrStats, TdarrWorker } from '../services/types'

export function tdarrWorker(overrides: Partial<TdarrWorker> = {}): TdarrWorker {
  return {
    id: 'w1', kind: 'transcode', hardware: 'gpu', file: '/movies/a.mkv', percentage: 10, eta: '0:10:00', fps: 100,
    originalSizeGb: 2, estimatedSizeGb: 1, ...overrides,
  }
}

export function tdarrNode(overrides: Partial<TdarrNode> = {}): TdarrNode {
  return {
    id: 'pc', name: 'pc-rtx2060', paused: false, online: true, busyWorkers: 0, workerCapacity: 2,
    workerLimits: { transcodeGpu: 2, transcodeCpu: 0, healthCheckGpu: 0, healthCheckCpu: 0 }, workers: [], ...overrides,
  }
}

export function tdarrOverview(nodes: TdarrNode[] = [tdarrNode()]): TdarrOverview {
  return { version: '2.94.02', nodes }
}

export const EMPTY_ERRORS: TdarrErrorList = { total: 0, items: [] }

export function tdarrStats(overrides: Partial<TdarrStats> = {}): TdarrStats {
  return {
    totals: { files: 2816, transcodes: 3278, healthChecks: 5310, spaceSavedGb: 592.95 },
    transcode: { onHold: 1, queued: 48, succeeded: 2766, failed: 3 },
    healthCheck: { queued: 4, succeeded: 2814, failed: 6 },
    errors: { transcode: EMPTY_ERRORS, healthCheck: EMPTY_ERRORS },
    ...overrides,
  }
}
