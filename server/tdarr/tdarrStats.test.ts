// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { toTdarrErrorFile, toTdarrStats, type RawTdarrStatistics } from './tdarrStats.js'

const STATISTICS: RawTdarrStatistics = {
  totalFileCount: 2816,
  totalTranscodeCount: 3278,
  totalHealthCheckCount: 5310,
  sizeDiff: 592.95,
  table0Count: 1,
  table1Count: 48,
  table2Count: 2766,
  table3Count: 3,
  table4Count: 4,
  table5Count: 2814,
  table6Count: 6,
}

const NO_ERRORS = { transcode: { total: 0, items: [] }, healthCheck: { total: 0, items: [] } }

describe('toTdarrStats', () => {
  it('maps statistics counters by name', () => {
    expect(toTdarrStats(STATISTICS, NO_ERRORS)).toEqual({
      totals: { files: 2816, transcodes: 3278, healthChecks: 5310, spaceSavedGb: 592.95 },
      transcode: { onHold: 1, queued: 48, succeeded: 2766, failed: 3 },
      healthCheck: { queued: 4, succeeded: 2814, failed: 6 },
      errors: NO_ERRORS,
    })
  })
})

describe('toTdarrErrorFile', () => {
  it('error file gets library name and iso date', () => {
    const libraries = [{ _id: 'roIZ0mLIo', name: 'series' }]
    expect(toTdarrErrorFile({ file: '/series/a.mkv', DB: 'roIZ0mLIo', lastTranscodeDate: 1791799200000 }, 'lastTranscodeDate', libraries))
      .toEqual({ file: '/series/a.mkv', library: 'series', date: '2026-10-12T10:00:00.000Z' })
    expect(toTdarrErrorFile({ file: '/x/b.mkv', DB: 'xyz', lastHealthCheckDate: 0 }, 'lastHealthCheckDate', libraries))
      .toEqual({ file: '/x/b.mkv', library: 'xyz', date: null })
    expect(toTdarrErrorFile({ file: '/x/c.mkv', DB: 'xyz' }, 'lastTranscodeDate', libraries))
      .toEqual({ file: '/x/c.mkv', library: 'xyz', date: null })
  })
})
