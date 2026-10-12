// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { callApp } from '../test/callApp.js'
import { FakeSonarrGateway, type FakeSonarrData } from '../test/FakeSonarrGateway.js'
import { startTestApp, type TestApp } from '../test/startTestApp.js'
import type { CalendarItem } from './calendarEpisodes.js'

let app: TestApp | undefined

afterEach(async () => {
  await app?.close()
  app = undefined
})

async function withSonarr(data: FakeSonarrData = {}): Promise<FakeSonarrGateway> {
  const gateway = new FakeSonarrGateway(data)
  app = await startTestApp({ sonarr: gateway })
  return gateway
}

const START = '2026-10-11T03:00:00.000Z'
const END = '2026-10-18T03:00:00.000Z'
const window = (start: string, end: string, extra = '') => `/api/sonarr/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}${extra}`

const target: CalendarItem = {
  episodeId: 27, seriesId: 1, seriesTitle: 'The Wire', seasonNumber: 1, episodeNumber: 1, title: 'The Target',
  airDateUtc: '2026-10-12T01:00:00Z', status: 'missing',
}

async function expect400(path: string, error: string, gateway: FakeSonarrGateway): Promise<void> {
  const res = await callApp(app!, 'GET', path)
  expect(res.status, path).toBe(400)
  expect(JSON.parse(res.body), path).toEqual({ error })
  expect(gateway.calls, path).toEqual([])
}

describe('sonarr calendar route', () => {
  it('calendar answers 200 with the gateway items', async () => {
    const gateway = await withSonarr({ calendar: [target] })
    const res = await callApp(app!, 'GET', window(START, END, '&unmonitored=true'))
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual([target])
    expect(gateway.calls).toEqual([`listCalendar:${JSON.stringify({ start: START, end: END, unmonitored: true })}`])
  })

  it('missing or non iso window returns 400 without calling sonarr', async () => {
    const gateway = await withSonarr()
    const cases: [string, string, string][] = [
      [`/api/sonarr/calendar?end=${END}`, '', END],
      [`/api/sonarr/calendar?start=${START}`, START, ''],
      [window('ontem', END), 'ontem', END],
      [window(START, '2026-13-40'), START, '2026-13-40'],
    ]
    for (const [path, start, end] of cases) {
      await expect400(path, `janela inválida: recebido start="${start}" end="${end}", esperado ISO 8601`, gateway)
    }
  })

  it('end not after start returns 400', async () => {
    const gateway = await withSonarr()
    for (const end of [START, '2026-10-10T03:00:00.000Z']) {
      await expect400(window(START, end), `janela inválida: end deve ser posterior a start, recebido start="${START}" end="${end}"`, gateway)
    }
  })

  it('window over 8 days returns 400 and exactly 8 days passes', async () => {
    const gateway = await withSonarr()
    const tooLong = '2026-10-19T03:00:00.001Z'
    await expect400(window(START, tooLong), `janela inválida: máximo 8 dias, recebido start="${START}" end="${tooLong}"`, gateway)
    const res = await callApp(app!, 'GET', window(START, '2026-10-19T03:00:00.000Z'))
    expect(res.status).toBe(200)
  })

  it('unmonitored defaults to false and rejects other values', async () => {
    const gateway = await withSonarr()
    await callApp(app!, 'GET', window(START, END))
    await callApp(app!, 'GET', window(START, END, '&unmonitored=false'))
    expect(gateway.calls.map((call) => JSON.parse(call.slice('listCalendar:'.length)).unmonitored)).toEqual([false, false])
    gateway.calls.length = 0
    for (const value of ['1', 'sim']) {
      await expect400(window(START, END, `&unmonitored=${value}`), `unmonitored inválido: recebido "${value}", esperado true ou false`, gateway)
    }
  })

  it('calendar answers 503 when sonarr is off and 502 when it fails', async () => {
    app = await startTestApp({ sonarr: null })
    const off = await callApp(app, 'GET', window(START, END))
    expect(off.status).toBe(503)
    expect(JSON.parse(off.body)).toEqual({ error: 'Sonarr não configurado (SONARR_URL ausente)' })
    await app.close()
    await withSonarr({ failWith: 'Sonarr indisponível em http://sonarr: HTTP 500 em /calendar' })
    const failed = await callApp(app!, 'GET', window(START, END))
    expect(failed.status).toBe(502)
    expect(JSON.parse(failed.body)).toEqual({ error: 'Sonarr indisponível em http://sonarr: HTTP 500 em /calendar' })
  })
})
