import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarPage } from './CalendarPage'
import * as api from '../services/api'
import type { CalendarItem } from '../services/types'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  fetchCalendar: vi.fn(),
}))

const THIS_WEEK = { start: '2026-10-11T03:00:00.000Z', end: '2026-10-18T03:00:00.000Z' }
const DAY_LABELS = ['dom 11/10', 'seg 12/10', 'ter 13/10', 'qua 14/10', 'qui 15/10', 'sex 16/10', 'sáb 17/10']

const target: CalendarItem = {
  episodeId: 27, seriesId: 1, seriesTitle: 'The Wire', seasonNumber: 1, episodeNumber: 5, title: 'The Pager',
  airDateUtc: '2026-10-12T02:30:00Z', status: 'missing',
}
const httpError = (error: string) => ({ isAxiosError: true, response: { status: 502, data: { error } }, message: 'x' })

function renderPage(route = '/sonarr/calendario') {
  return renderWithProviders(<CalendarPage />, { route, path: '/sonarr/calendario' })
}

const location = () => screen.getByTestId('location').textContent
const day = (label: string) => screen.getByRole('region', { name: label })

beforeEach(() => {
  // Only Date is faked, so react-query and waitFor keep their real timers.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-14T15:00:00Z'))
  vi.mocked(api.fetchCalendar).mockReset().mockResolvedValue([target])
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CalendarPage', () => {
  it('shows sunday to saturday with today marked', async () => {
    renderPage()
    await screen.findByText('The Wire')
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(DAY_LABELS)
    const current = DAY_LABELS.filter((label) => day(label).getAttribute('aria-current') === 'date')
    expect(current).toEqual(['qua 14/10'])
  })

  it('requests the local week window', async () => {
    renderPage()
    await waitFor(() => expect(api.fetchCalendar).toHaveBeenCalledWith({ ...THIS_WEEK, unmonitored: false }))
  })

  it('navigates weeks and keeps the sunday in the url', async () => {
    renderPage()
    await screen.findByText('The Wire')
    fireEvent.click(screen.getByRole('button', { name: 'Semana seguinte' }))
    expect(location()).toBe('/sonarr/calendario?semana=2026-10-18')
    await waitFor(() => expect(api.fetchCalendar).toHaveBeenLastCalledWith({
      start: '2026-10-18T03:00:00.000Z', end: '2026-10-25T03:00:00.000Z', unmonitored: false,
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }))
    expect(location()).toBe('/sonarr/calendario?semana=2026-10-11')
  })

  it('today button drops the week from the url', async () => {
    renderPage('/sonarr/calendario?semana=2026-09-06')
    await screen.findByRole('region', { name: 'dom 06/09' })
    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    expect(location()).toBe('/sonarr/calendario')
  })

  it('places each episode on its local day with local time', async () => {
    renderPage()
    const link = await screen.findByRole('link', { name: /The Wire/ })
    expect(day('dom 11/10')).toContainElement(link)
    for (const text of ['23:30', 'The Wire', 'S01E05', 'The Pager']) expect(within(link).getByText(text)).toBeInTheDocument()
    expect(link).toHaveAttribute('data-status', 'missing')
  })

  it('items link to the series detail', async () => {
    vi.mocked(api.fetchCalendar).mockResolvedValue([
      target,
      { ...target, episodeId: 30, seriesId: 9, seriesTitle: 'Andor', episodeNumber: 1, airDateUtc: '2026-10-15T01:00:00Z' },
      { ...target, episodeId: 31, seriesId: 9, seriesTitle: 'Andor', episodeNumber: 2, airDateUtc: '2026-10-15T01:00:00Z' },
    ])
    renderPage()
    expect(await screen.findByRole('link', { name: /The Wire/ })).toHaveAttribute('href', '/sonarr/1')
    const batch = screen.getByRole('link', { name: /Andor/ })
    expect(batch).toHaveAttribute('href', '/sonarr/9')
    expect(within(batch).getByText('S01E01–E02 · 2 episódios')).toBeInTheDocument()
  })

  it('unmonitored toggle lives in the url', async () => {
    renderPage()
    const toggle = await screen.findByRole('checkbox', { name: 'Mostrar não monitorados' })
    expect(toggle).not.toBeChecked()
    fireEvent.click(toggle)
    expect(location()).toBe('/sonarr/calendario?naoMonitorados=1')
    await waitFor(() => expect(api.fetchCalendar).toHaveBeenLastCalledWith({ ...THIS_WEEK, unmonitored: true }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mostrar não monitorados' }))
    expect(location()).toBe('/sonarr/calendario')
  })

  it('opens with unmonitored shown when the url says so', async () => {
    renderPage('/sonarr/calendario?naoMonitorados=1')
    expect(await screen.findByRole('checkbox', { name: 'Mostrar não monitorados' })).toBeChecked()
    expect(api.fetchCalendar).toHaveBeenCalledWith({ ...THIS_WEEK, unmonitored: true })
  })

  it('shows loading, empty week and error states', async () => {
    vi.mocked(api.fetchCalendar).mockReturnValue(new Promise(() => {}))
    const loading = renderPage()
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
    loading.unmount()

    vi.mocked(api.fetchCalendar).mockResolvedValue([])
    const empty = renderPage()
    expect(await screen.findByText('Nenhum episódio nesta semana')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'dom 11/10' })).not.toBeInTheDocument()
    empty.unmount()

    vi.mocked(api.fetchCalendar).mockRejectedValue(httpError('Sonarr indisponível'))
    renderPage()
    expect(await screen.findByText('Sonarr indisponível')).toBeInTheDocument()
  })

  it('empty days say sem episódios', async () => {
    renderPage()
    await screen.findByText('The Wire')
    const empty = DAY_LABELS.filter((label) => within(day(label)).queryByText('sem episódios'))
    expect(empty).toEqual(DAY_LABELS.filter((label) => label !== 'dom 11/10'))
  })

  it('legend names the four statuses', async () => {
    renderPage()
    const legend = await screen.findByRole('list', { name: 'Legenda' })
    const entries = within(legend).getAllByRole('listitem').map((entry) => [entry.textContent, entry.getAttribute('data-status')])
    expect(entries).toEqual([['Baixado', 'downloaded'], ['Faltando', 'missing'], ['Não exibido', 'unaired'], ['Não monitorado', 'unmonitored']])
  })
})
