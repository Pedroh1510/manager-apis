// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { installMeterProvider } from '../test/meters.js'

let meters: ReturnType<typeof installMeterProvider>
let business: typeof import('./business.js')

beforeAll(async () => {
  meters = installMeterProvider()
  business = await import('./business.js')
})

afterAll(async () => {
  await meters.uninstall()
})

describe('business events', () => {
  it.each(['apis.series.added', 'apis.searches.requested', 'apis.releases.grabbed', 'apis.imports.started', 'apis.uploads.stored'])(
    'each business event increments its counter: %s',
    async (name) => {
      business.countBusinessEvent(name as never, { source: 'sonarr', result: 'ok' })

      const points = await meters.points(name)
      expect(points).toHaveLength(1)
      expect(points[0].attributes).toEqual({ source: 'sonarr', result: 'ok' })
      expect(points[0].value).toBe(1)
    },
  )

  it('an unknown event name records nothing', async () => {
    business.countBusinessEvent('apis.unknown.thing' as never, { source: 'sonarr', result: 'ok' })

    expect(await meters.points('apis.unknown.thing')).toEqual([])
  })

  it('countOutcome counts ok and returns the value, counts fail and rethrows', async () => {
    const boom = new Error('boom')

    expect(await business.countOutcome('apis.imports.started', 'local', async () => 7)).toBe(7)
    await expect(business.countOutcome('apis.imports.started', 'local', async () => { throw boom })).rejects.toBe(boom)

    const points = await meters.points('apis.imports.started')
    const local = points.filter((point) => point.attributes.source === 'local')
    expect(local.map((point) => [point.attributes.result, point.value]).sort()).toEqual([['fail', 1], ['ok', 1]])
  })
})
