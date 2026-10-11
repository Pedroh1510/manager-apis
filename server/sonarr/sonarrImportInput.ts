import type { ImportChoice, ImportSource } from './manualImport.js'
import { InvalidInputError, invalidBody, isPositiveInteger } from './sonarrInput.js'

/** `source=upload` asked while SONARR_UPLOAD_DIR is absent (503, like the upload routes). */
export class UploadDisabledError extends Error {
  constructor() {
    super('upload desligado (SONARR_UPLOAD_DIR ausente)')
  }
}

const UPLOAD_SOURCE = 'upload'

/** @example parseDownloadId('SABnzbd_nzo_1') // 'SABnzbd_nzo_1' */
export function parseDownloadId(raw: unknown): string {
  const downloadId = typeof raw === 'string' ? raw : ''
  if (downloadId.trim() !== '') return downloadId
  throw new InvalidInputError(`downloadId vazio: recebido "${downloadId}"`)
}

/** @example parseCommandId('392') // 392 */
export function parseCommandId(raw: string): number {
  const id = raw.trim() === '' ? NaN : Number(raw)
  if (isPositiveInteger(id)) return id
  throw new InvalidInputError(`id de comando inválido: "${raw}"`)
}

function uploadSource(uploadDir: string | null, seriesId?: number): ImportSource {
  if (uploadDir === null) throw new UploadDisabledError()
  return seriesId === undefined ? { kind: 'folder', folder: uploadDir } : { kind: 'folder', folder: uploadDir, seriesId }
}

const invalidQuery = (query: Record<string, unknown>) =>
  new InvalidInputError(`consulta inválida: esperado downloadId ou source=upload, recebido ${JSON.stringify(query)}`)

function parseOptionalSeriesId(raw: unknown, query: Record<string, unknown>): number | undefined {
  if (raw === undefined) return undefined
  const seriesId = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN
  if (isPositiveInteger(seriesId)) return seriesId
  throw invalidQuery(query)
}

/**
 * Which files `GET /import/files` lists: a download's, or the upload folder's (decision K1 for the messages).
 * @example parseImportFilesQuery({ source: 'upload', seriesId: '2' }, '/uploads') // { kind: 'folder', folder: '/uploads', seriesId: 2 }
 */
export function parseImportFilesQuery(query: Record<string, unknown>, uploadDir: string | null): ImportSource {
  if (query.downloadId !== undefined && query.source === undefined) return { kind: 'download', downloadId: parseDownloadId(query.downloadId) }
  if (query.source !== UPLOAD_SOURCE || query.downloadId !== undefined) throw invalidQuery(query)
  return uploadSource(uploadDir, parseOptionalSeriesId(query.seriesId, query))
}

function isImportChoice(value: unknown): value is ImportChoice {
  const file = value as Partial<ImportChoice> | null
  return typeof file?.path === 'string' && file.path !== '' && isPositiveInteger(file.seriesId)
    && Array.isArray(file.episodeIds) && file.episodeIds.length > 0 && file.episodeIds.every(isPositiveInteger)
}

const IMPORT_SHAPE = 'esperado { downloadId: texto não vazio | source: "upload", files: [{ path: texto não vazio, seriesId: inteiro positivo, episodeIds: inteiros positivos (ao menos 1) }] (ao menos 1) }'

type ImportBody = { downloadId?: unknown; source?: unknown; files?: unknown }

function hasValidSource({ downloadId, source }: ImportBody): boolean {
  if (source === undefined) return typeof downloadId === 'string' && downloadId !== ''
  return source === UPLOAD_SOURCE && downloadId === undefined
}

/** @example parseImportBody({ downloadId: 'D1', files: [{ path: '/dl/a.mkv', seriesId: 2, episodeIds: [123] }] }, null) */
export function parseImportBody(body: unknown, uploadDir: string | null): { source: ImportSource; files: ImportChoice[] } {
  const input = (body ?? {}) as ImportBody
  const { files } = input
  const isValid = hasValidSource(input) && Array.isArray(files) && files.length > 0 && files.every(isImportChoice)
  if (!isValid) throw invalidBody(IMPORT_SHAPE, body)
  const choices = files.map(({ path, seriesId, episodeIds }: ImportChoice) => ({ path, seriesId, episodeIds }))
  const source: ImportSource = input.source === undefined ? { kind: 'download', downloadId: input.downloadId as string } : uploadSource(uploadDir)
  return { source, files: choices }
}
