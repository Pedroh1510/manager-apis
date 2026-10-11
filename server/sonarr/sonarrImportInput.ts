import type { ImportChoice } from './manualImport.js'
import { InvalidInputError, invalidBody, isPositiveInteger } from './sonarrInput.js'

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

function isImportChoice(value: unknown): value is ImportChoice {
  const file = value as Partial<ImportChoice> | null
  return typeof file?.path === 'string' && file.path !== '' && isPositiveInteger(file.seriesId)
    && Array.isArray(file.episodeIds) && file.episodeIds.length > 0 && file.episodeIds.every(isPositiveInteger)
}

const IMPORT_SHAPE = 'esperado { downloadId: texto não vazio, files: [{ path: texto não vazio, seriesId: inteiro positivo, episodeIds: inteiros positivos (ao menos 1) }] (ao menos 1) }'

/** @example parseImportBody({ downloadId: 'D1', files: [{ path: '/dl/a.mkv', seriesId: 2, episodeIds: [123] }] }) */
export function parseImportBody(body: unknown): { downloadId: string; files: ImportChoice[] } {
  const { downloadId, files } = (body ?? {}) as { downloadId?: unknown; files?: unknown }
  const isValid = typeof downloadId === 'string' && downloadId !== '' && Array.isArray(files) && files.length > 0 && files.every(isImportChoice)
  if (!isValid) throw invalidBody(IMPORT_SHAPE, body)
  return { downloadId, files: files.map(({ path, seriesId, episodeIds }: ImportChoice) => ({ path, seriesId, episodeIds })) }
}
