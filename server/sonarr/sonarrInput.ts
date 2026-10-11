import type { ReleaseQuery } from './releases.js'

/** Request input that fails validation (400); the message names the received value. */
export class InvalidInputError extends Error {}

const isPositiveInteger = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0

function toPositiveInteger(raw: unknown): number | null {
  const value = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw
  return isPositiveInteger(value) ? value : null
}

/** @example parseSeriesId('12') // 12 */
export function parseSeriesId(raw: string): number {
  const id = toPositiveInteger(raw)
  if (id !== null) return id
  throw new InvalidInputError(`id de série inválido: "${raw}", esperado inteiro positivo`)
}

/** @example parseEpisodeId('11') // 11 */
export function parseEpisodeId(raw: string): number {
  const id = toPositiveInteger(raw)
  if (id !== null) return id
  throw new InvalidInputError(`id de episódio inválido: "${raw}", esperado inteiro positivo`)
}

/** Season 0 is Specials, so zero is valid here. @example parseSeasonNumber('0') // 0 */
export function parseSeasonNumber(raw: string): number {
  const value = raw.trim() === '' ? NaN : Number(raw)
  if (Number.isInteger(value) && value >= 0) return value
  throw new InvalidInputError(`temporada inválida: "${raw}", esperado inteiro ≥ 0`)
}

function invalidBody(reason: string, body: unknown): InvalidInputError {
  return new InvalidInputError(`corpo inválido: ${reason}, recebido ${JSON.stringify(body ?? null)}`)
}

/** @example parseMonitoredBody({ monitored: false }) // false */
export function parseMonitoredBody(body: unknown): boolean {
  const monitored = (body as { monitored?: unknown } | undefined)?.monitored
  if (typeof monitored !== 'boolean') throw invalidBody('esperado { monitored: boolean }', body)
  return monitored
}

/** @example parseEpisodesMonitorBody({ episodeIds: [11], monitored: true }) */
export function parseEpisodesMonitorBody(body: unknown): { episodeIds: number[]; monitored: boolean } {
  const episodeIds = (body as { episodeIds?: unknown } | undefined)?.episodeIds
  const isIdList = Array.isArray(episodeIds) && episodeIds.length > 0 && episodeIds.every(isPositiveInteger)
  if (!isIdList) throw invalidBody('esperado { episodeIds: inteiros positivos (ao menos 1), monitored: boolean }', body)
  return { episodeIds, monitored: parseMonitoredBody(body) }
}

/** @example parseGrabBody({ guid: 'g1', indexerId: 3 }) */
export function parseGrabBody(body: unknown): { guid: string; indexerId: number } {
  const { guid, indexerId } = (body ?? {}) as { guid?: unknown; indexerId?: unknown }
  if (typeof guid !== 'string' || guid === '' || !isPositiveInteger(indexerId)) {
    throw invalidBody('esperado { guid: texto não vazio, indexerId: inteiro positivo }', body)
  }
  return { guid, indexerId }
}

/**
 * One episode, or one season of a series, as Sonarr's /release accepts.
 * @example parseReleaseQuery({ seriesId: '1', seasonNumber: '2' }) // { seriesId: 1, seasonNumber: 2 }
 */
export function parseReleaseQuery(query: Record<string, unknown>): ReleaseQuery {
  const episodeId = toPositiveInteger(query.episodeId)
  if (episodeId !== null) return { episodeId }
  const seriesId = toPositiveInteger(query.seriesId)
  const seasonNumber = typeof query.seasonNumber === 'string' ? Number(query.seasonNumber) : NaN
  if (seriesId !== null && Number.isInteger(seasonNumber) && seasonNumber >= 0 && query.seasonNumber !== '') {
    return { seriesId, seasonNumber }
  }
  throw new InvalidInputError(`consulta inválida: esperado episodeId ou seriesId+seasonNumber, recebido ${JSON.stringify(query)}`)
}
