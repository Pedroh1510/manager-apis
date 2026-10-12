import type { CalendarWindow } from './calendarEpisodes.js'
import { InvalidInputError } from './sonarrInput.js'

/** A week plus slack for a daylight-saving shift; anything bigger is not this screen asking. */
const MAX_WINDOW_MS = 8 * 24 * 60 * 60 * 1000
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/

const asText = (raw: unknown): string => (typeof raw === 'string' ? raw : '')

function parseInstant(raw: string): number | null {
  if (!ISO_WITH_ZONE.test(raw)) return null
  const time = Date.parse(raw)
  return Number.isNaN(time) ? null : time
}

function parseUnmonitored(raw: unknown): boolean {
  if (raw === undefined || raw === 'false') return false
  if (raw === 'true') return true
  throw new InvalidInputError(`unmonitored inválido: recebido "${String(raw)}", esperado true ou false`)
}

/**
 * Door 2: ISO instants with a zone, `end > start`, at most 8 days apart.
 * @example parseCalendarWindow({ start: '2026-10-11T03:00:00Z', end: '2026-10-18T03:00:00Z' })
 */
export function parseCalendarWindow(query: Record<string, unknown>): CalendarWindow {
  const start = asText(query.start)
  const end = asText(query.end)
  const received = `recebido start="${start}" end="${end}"`
  const startTime = parseInstant(start)
  const endTime = parseInstant(end)
  if (startTime === null || endTime === null) throw new InvalidInputError(`janela inválida: ${received}, esperado ISO 8601`)
  if (endTime <= startTime) throw new InvalidInputError(`janela inválida: end deve ser posterior a start, ${received}`)
  if (endTime - startTime > MAX_WINDOW_MS) throw new InvalidInputError(`janela inválida: máximo 8 dias, ${received}`)
  return { start, end, unmonitored: parseUnmonitored(query.unmonitored) }
}
