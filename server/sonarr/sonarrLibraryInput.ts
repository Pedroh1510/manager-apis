import { InvalidInputError, invalidBody, isPositiveInteger } from './sonarrInput.js'
import { MONITOR_OPTIONS, SERIES_TYPES, type AddSeriesInput } from './seriesLookup.js'

/** Sonarr's lookup answers 500 to an empty term, so it never gets one. @example parseLookupTerm(' wire ') // ' wire ' */
export function parseLookupTerm(raw: unknown): string {
  const term = typeof raw === 'string' ? raw : ''
  if (term.trim() !== '') return term
  throw new InvalidInputError(`termo de busca vazio: recebido "${term}"`)
}

/** Absent means the first page. @example parseMissingPage('2') // 2 */
export function parseMissingPage(raw: unknown): number {
  if (raw === undefined) return 1
  const page = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN
  if (isPositiveInteger(page)) return page
  throw new InvalidInputError(`página inválida: "${String(raw)}"`)
}

const isOneOf = <T extends string>(options: readonly T[], value: unknown): value is T => options.includes(value as T)

const ADD_SHAPE = `esperado { tvdbId, qualityProfileId: inteiros positivos, rootFolderPath: texto não vazio, seriesType: ${SERIES_TYPES.join('|')}, monitor: ${MONITOR_OPTIONS.join('|')}, searchForMissingEpisodes: boolean }`

/** @example parseAddSeriesBody({ tvdbId: 1, qualityProfileId: 4, rootFolderPath: '/tv', seriesType: 'anime', monitor: 'all', searchForMissingEpisodes: true }) */
export function parseAddSeriesBody(body: unknown): AddSeriesInput {
  const input = (body ?? {}) as Partial<Record<keyof AddSeriesInput, unknown>>
  const isValid = isPositiveInteger(input.tvdbId) && isPositiveInteger(input.qualityProfileId)
    && typeof input.rootFolderPath === 'string' && input.rootFolderPath !== ''
    && isOneOf(SERIES_TYPES, input.seriesType) && isOneOf(MONITOR_OPTIONS, input.monitor)
    && typeof input.searchForMissingEpisodes === 'boolean'
  if (!isValid) throw invalidBody(ADD_SHAPE, body)
  const { tvdbId, qualityProfileId, rootFolderPath, seriesType, monitor, searchForMissingEpisodes } = input as AddSeriesInput
  return { tvdbId, qualityProfileId, rootFolderPath, seriesType, monitor, searchForMissingEpisodes }
}

/** @example parseEpisodeIdsBody({ episodeIds: [60, 59] }) // [60, 59] */
export function parseEpisodeIdsBody(body: unknown): number[] {
  const episodeIds = (body as { episodeIds?: unknown } | undefined)?.episodeIds
  if (Array.isArray(episodeIds) && episodeIds.length > 0 && episodeIds.every(isPositiveInteger)) return episodeIds
  throw invalidBody('esperado { episodeIds: inteiros positivos (ao menos 1) }', body)
}
