/**
 * The single `statistics` document of `StatisticsJSONDB`. The `tableNCount` meaning was matched
 * against FileJSONDB counts and the WebUI bundle's table actions on 2026-10-12 (plan Assumptions).
 */
export interface RawTdarrStatistics {
  totalFileCount: number
  totalTranscodeCount: number
  totalHealthCheckCount: number
  /** GB saved by transcoding */
  sizeDiff: number
  table0Count: number
  table1Count: number
  table2Count: number
  table3Count: number
  table4Count: number
  table5Count: number
  table6Count: number
}

export interface RawTdarrLibrary {
  _id: string
  name: string
}

/** One row of `POST /api/v2/client/status-tables`. */
export interface RawTdarrStatusTableFile {
  file: string
  /** library id */
  DB: string
  lastTranscodeDate?: number
  lastHealthCheckDate?: number
}

export type TdarrErrorDateField = 'lastTranscodeDate' | 'lastHealthCheckDate'

export interface TdarrErrorFile {
  file: string
  library: string
  /** ISO 8601, null when Tdarr never recorded one */
  date: string | null
}

export interface TdarrErrorList {
  total: number
  items: TdarrErrorFile[]
}

export interface TdarrErrorLists {
  transcode: TdarrErrorList
  healthCheck: TdarrErrorList
}

export interface TdarrStats {
  totals: { files: number; transcodes: number; healthChecks: number; spaceSavedGb: number }
  transcode: { onHold: number; queued: number; succeeded: number; failed: number }
  healthCheck: { queued: number; succeeded: number; failed: number }
  errors: TdarrErrorLists
}

/**
 * Names Tdarr's numbered table counters, so the browser never depends on `table3Count`.
 * @example toTdarrStats(statistics, errors).transcode.failed
 */
export function toTdarrStats(raw: RawTdarrStatistics, errors: TdarrErrorLists): TdarrStats {
  return {
    totals: { files: raw.totalFileCount, transcodes: raw.totalTranscodeCount, healthChecks: raw.totalHealthCheckCount, spaceSavedGb: raw.sizeDiff },
    transcode: { onHold: raw.table0Count, queued: raw.table1Count, succeeded: raw.table2Count, failed: raw.table3Count },
    healthCheck: { queued: raw.table4Count, succeeded: raw.table5Count, failed: raw.table6Count },
    errors,
  }
}

/**
 * A failed file with its library name (the id when the library is gone) and an ISO date.
 * @example toTdarrErrorFile(row, 'lastTranscodeDate', libraries).library // 'series'
 */
export function toTdarrErrorFile(raw: RawTdarrStatusTableFile, dateField: TdarrErrorDateField, libraries: RawTdarrLibrary[]): TdarrErrorFile {
  const epochMs = raw[dateField]
  return {
    file: raw.file,
    library: libraries.find((library) => library._id === raw.DB)?.name ?? raw.DB,
    date: epochMs ? new Date(epochMs).toISOString() : null,
  }
}
