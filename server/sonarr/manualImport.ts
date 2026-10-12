/** Queue states where Sonarr waits for a manual import (decision R1). */
const STUCK_STATES = ['importPending', 'importBlocked'] as const

/** The fields of a Sonarr API v3 `/queue` record this server reads. */
export interface RawQueueRecord {
  downloadId?: string
  title: string
  size: number
  trackedDownloadState?: string
  statusMessages?: { title?: string; messages?: string[] }[]
  series?: { title: string }
}

export interface StuckDownload {
  downloadId: string
  title: string
  seriesTitle: string | null
  state: string
  messages: string[]
  size: number
}

/** The fields of a Sonarr API v3 `/manualimport` candidate this server reads or sends back. */
export interface RawImportCandidate {
  path: string
  relativePath?: string
  size: number
  series?: { id: number; title: string }
  episodes?: { id: number; seasonNumber: number; episodeNumber: number }[]
  quality?: { quality?: { name?: string } }
  languages?: { id: number; name: string }[]
  releaseGroup?: string | null
  releaseType?: string
  indexerFlags?: number
  rejections?: { reason: string }[]
}

export interface ImportCandidate {
  path: string
  relativePath: string
  size: number
  seriesId: number | null
  seriesTitle: string | null
  episodes: { id: number; seasonNumber: number; episodeNumber: number }[]
  quality: string
  languages: string[]
  releaseGroup: string | null
  rejections: string[]
}

/** Where the files to import come from: a stuck download, or the upload folder (door 2 of PR 4b). */
export type ImportSource = { kind: 'download'; downloadId: string } | { kind: 'folder'; folder: string }

/** Shown in errors, e.g. `arquivo não encontrado no download D1: …`. */
export const describeSource = (source: ImportSource) =>
  source.kind === 'download' ? `no download ${source.downloadId}` : 'na pasta de upload'

/** What the admin chose for one file. */
export interface ImportChoice {
  path: string
  seriesId: number
  episodeIds: number[]
}

export type CommandState = 'pending' | 'completed' | 'failed'

export interface CommandStatus {
  state: CommandState
  message: string | null
}

/** The fields of a Sonarr API v3 `/command/:id` answer this server reads. */
export interface RawCommand {
  status: string
  result?: string
  message?: string
}

type RawStatusMessage = NonNullable<RawQueueRecord['statusMessages']>[number]

/** Sonarr titles each warning (often the file name) and lists its reasons; a bare title is a warning on its own (decision M1). */
function statusTexts(status: RawStatusMessage): string[] {
  const messages = status.messages ?? []
  if (messages.length === 0) return status.title ? [status.title] : []
  return messages.map((message) => (status.title ? `${status.title}: ${message}` : message))
}

const isStuck = (record: RawQueueRecord) => (STUCK_STATES as readonly string[]).includes(record.trackedDownloadState ?? '')

/**
 * One entry per stuck download: Sonarr lists a download once per episode it maps to.
 * @example toStuckDownloads(queue.records)[0].messages // ['random name 07.mkv: Invalid season or episode']
 */
export function toStuckDownloads(records: RawQueueRecord[]): StuckDownload[] {
  const byDownload = new Map<string, StuckDownload>()
  for (const record of records.filter(isStuck)) {
    const downloadId = record.downloadId ?? record.title
    const current = byDownload.get(downloadId) ?? {
      downloadId, title: record.title, seriesTitle: record.series?.title ?? null,
      state: record.trackedDownloadState ?? '', messages: [], size: record.size,
    }
    const texts = (record.statusMessages ?? []).flatMap(statusTexts)
    byDownload.set(downloadId, { ...current, messages: [...new Set([...current.messages, ...texts])] })
  }
  return [...byDownload.values()]
}

/** @example toImportCandidate(rawFromSonarr).rejections // ['Unknown Series'] */
export function toImportCandidate(candidate: RawImportCandidate): ImportCandidate {
  return {
    path: candidate.path,
    relativePath: candidate.relativePath ?? candidate.path,
    size: candidate.size,
    seriesId: candidate.series?.id ?? null,
    seriesTitle: candidate.series?.title ?? null,
    episodes: (candidate.episodes ?? []).map(({ id, seasonNumber, episodeNumber }) => ({ id, seasonNumber, episodeNumber })),
    quality: candidate.quality?.quality?.name ?? '',
    languages: (candidate.languages ?? []).map((language) => language.name),
    releaseGroup: candidate.releaseGroup || null,
    rejections: (candidate.rejections ?? []).map((rejection) => rejection.reason),
  }
}

/**
 * One `ManualImport` file: the admin's series and episodes over Sonarr's own detection (door 1);
 * a folder file has no download to tie it to.
 * @example buildImportFile(candidate, { path, seriesId: 2, episodeIds: [123] }, { kind: 'download', downloadId: 'D1' })
 */
export function buildImportFile(candidate: RawImportCandidate, choice: ImportChoice, source: ImportSource): Record<string, unknown> {
  return {
    path: choice.path,
    seriesId: choice.seriesId,
    episodeIds: choice.episodeIds,
    ...(source.kind === 'download' ? { downloadId: source.downloadId } : {}),
    quality: candidate.quality,
    languages: candidate.languages,
    releaseGroup: candidate.releaseGroup,
    releaseType: candidate.releaseType,
    indexerFlags: candidate.indexerFlags,
  }
}

const PENDING_STATUSES = ['queued', 'started']

/**
 * Sonarr's command lifecycle reduced to what the screen needs (door 2).
 * @example toCommandState({ status: 'completed', result: 'successful' }).state // 'completed'
 */
export function toCommandState(command: RawCommand): CommandStatus {
  const message = command.message || null
  if (PENDING_STATUSES.includes(command.status)) return { state: 'pending', message }
  const isSuccess = command.status === 'completed' && command.result === 'successful'
  return { state: isSuccess ? 'completed' : 'failed', message }
}

/** The queue keeps the seed going (`auto`); an upload leaves its folder (`move`, decision Q5). */
export const importModeOf = (source: ImportSource) => (source.kind === 'download' ? 'auto' : 'move')
