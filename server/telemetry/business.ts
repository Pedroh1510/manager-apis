import { metrics, type Counter } from '@opentelemetry/api'
import { SERVICE_NAME } from './config.js'

// app-observability door 2d: user actions that change Sonarr or the upload folder
export const BUSINESS_EVENTS = [
  'apis.series.added',
  'apis.searches.requested',
  'apis.releases.grabbed',
  'apis.imports.started',
  'apis.uploads.stored',
] as const
export type BusinessEvent = (typeof BUSINESS_EVENTS)[number]

/** `sonarr` for a Sonarr write, `local` for the upload folder (closed domain, never a title). */
export type BusinessSource = 'sonarr' | 'local'

const counters = new Map<BusinessEvent, Counter>()

function counter(name: BusinessEvent): Counter {
  let found = counters.get(name)
  if (!found) {
    found = metrics.getMeter(SERVICE_NAME).createCounter(name)
    counters.set(name, found)
  }
  return found
}

/**
 * Counts one business event with `source` and `result` ok | fail.
 * @example countBusinessEvent('apis.series.added', { source: 'sonarr', result: 'ok' })
 */
export function countBusinessEvent(name: BusinessEvent, attributes: { source: BusinessSource; result: 'ok' | 'fail' }): void {
  if (!BUSINESS_EVENTS.includes(name)) return
  counter(name).add(1, { source: attributes.source, result: attributes.result })
}

/**
 * Runs the action and counts it: `ok` when it resolves, `fail` when it throws (the error goes on).
 * Parse the request before calling it, so a bad body is not counted.
 * @example const id = await countOutcome('apis.series.added', 'sonarr', () => gateway.addSeries(input))
 */
export async function countOutcome<T>(name: BusinessEvent, source: BusinessSource, action: () => Promise<T>): Promise<T> {
  try {
    const value = await action()
    countBusinessEvent(name, { source, result: 'ok' })
    return value
  } catch (error: unknown) {
    countBusinessEvent(name, { source, result: 'fail' })
    throw error
  }
}
