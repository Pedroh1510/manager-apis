// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FakeSonarrApi, type FakeSonarrOptions } from '../test/FakeSonarrApi.js'
import { FetchSonarrGateway, SonarrGatewayError } from './sonarrGateway.js'
import type { RawCalendarEpisode } from './calendarEpisodes.js'

let sonarr: FakeSonarrApi | undefined

afterEach(async () => {
  await sonarr?.close()
  sonarr = undefined
})

const NOW = new Date('2026-10-14T12:00:00Z')

async function gatewayFor(options: FakeSonarrOptions) {
  sonarr = await FakeSonarrApi.start(options)
  return new FetchSonarrGateway({ url: sonarr.url, apiKey: 'k3y' }, undefined, () => NOW)
}

const target: RawCalendarEpisode = {
  id: 27, seriesId: 1, seasonNumber: 1, episodeNumber: 1, title: 'The Target',
  airDateUtc: '2026-10-12T01:00:00Z', hasFile: false, monitored: true, series: { title: 'The Wire' },
}
const orphan: RawCalendarEpisode = { ...target, id: 28, hasFile: true, series: undefined }

describe('FetchSonarrGateway calendar', () => {
  it('calendar asks sonarr for the window with series embedded', async () => {
    const gateway = await gatewayFor({ calendar: [target, orphan] })
    const items = await gateway.listCalendar({ start: '2026-10-11T03:00:00.000Z', end: '2026-10-18T03:00:00.000Z', unmonitored: false })
    const url = new URL(sonarr!.requests[0].url, 'http://fake')
    expect(url.pathname).toBe('/api/v3/calendar')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      start: '2026-10-11T03:00:00.000Z', end: '2026-10-18T03:00:00.000Z', unmonitored: 'false', includeSeries: 'true',
    })
    expect(items).toEqual([
      { episodeId: 27, seriesId: 1, seriesTitle: 'The Wire', seasonNumber: 1, episodeNumber: 1, title: 'The Target', airDateUtc: '2026-10-12T01:00:00Z', status: 'missing' },
      { episodeId: 28, seriesId: 1, seriesTitle: '', seasonNumber: 1, episodeNumber: 1, title: 'The Target', airDateUtc: '2026-10-12T01:00:00Z', status: 'downloaded' },
    ])
  })

  it('an upstream 500 on calendar becomes a gateway error', async () => {
    const gateway = await gatewayFor({ failStatus: 500 })
    const failure = gateway.listCalendar({ start: '2026-10-11T03:00:00.000Z', end: '2026-10-18T03:00:00.000Z', unmonitored: true })
    await expect(failure).rejects.toThrow(SonarrGatewayError)
    await expect(failure).rejects.toThrow(`Sonarr indisponível em ${sonarr!.url}: HTTP 500 em /calendar`)
  })
})
