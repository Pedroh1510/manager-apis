import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SeriesLibraryPage } from './SeriesLibraryPage'
import * as api from '../services/api'
import type { SeriesSummary } from '../services/types'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  fetchSeriesList: vi.fn(),
}))

const acao: SeriesSummary = {
  id: 2, title: 'Ação Total', alternateTitles: ['Action Total'], year: 2021, status: 'continuing', network: 'X', episodeFileCount: 10, episodeCount: 12,
}
const wire: SeriesSummary = {
  id: 1, title: 'The Wire', alternateTitles: [], year: 2002, status: 'ended', network: 'HBO', episodeFileCount: 60, episodeCount: 60,
}
const httpError = (status: number, error: string) => ({ isAxiosError: true, response: { status, data: { error } }, message: 'x' })
const cards = () => screen.queryAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('/sonarr/'))

beforeEach(() => {
  vi.mocked(api.fetchSeriesList).mockReset()
})

describe('SeriesLibraryPage', () => {
  it('renders one linked poster card per series in order', async () => {
    vi.mocked(api.fetchSeriesList).mockResolvedValue([acao, wire])
    renderWithProviders(<SeriesLibraryPage />)

    await screen.findByText('Ação Total')
    const links = cards()
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/sonarr/2', '/sonarr/1'])
    expect(within(links[0]).getByRole('img')).toHaveAttribute('src', '/api/sonarr/series/2/poster')
    expect(within(links[0]).getByText('2021')).toBeInTheDocument()
    expect(within(links[0]).getByText('10/12 episódios')).toBeInTheDocument()
    expect(within(links[1]).getByRole('img')).toHaveAttribute('src', '/api/sonarr/series/1/poster')
    expect(within(links[1]).getByText('The Wire')).toBeInTheDocument()
    expect(within(links[1]).getByText('2002')).toBeInTheDocument()
    expect(within(links[1]).getByText('60/60 episódios')).toBeInTheDocument()
  })

  it('filters by name and keeps the query in the url', async () => {
    vi.mocked(api.fetchSeriesList).mockResolvedValue([acao, wire])
    renderWithProviders(<SeriesLibraryPage />)
    fireEvent.change(await screen.findByRole('textbox', { name: 'Filtrar por nome' }), { target: { value: 'acao' } })

    expect(cards().map((link) => link.textContent)).toEqual([expect.stringContaining('Ação Total')])
    expect(screen.getByTestId('location')).toHaveTextContent('?q=acao')
  })

  it('starts with the query read from the url', async () => {
    vi.mocked(api.fetchSeriesList).mockResolvedValue([acao, wire])
    renderWithProviders(<SeriesLibraryPage />, { route: '/sonarr?q=wire' })

    expect(await screen.findByRole('textbox', { name: 'Filtrar por nome' })).toHaveValue('wire')
    await screen.findByText('The Wire')
    expect(cards()).toHaveLength(1)
  })

  it('shows the empty and no-match states', async () => {
    vi.mocked(api.fetchSeriesList).mockResolvedValue([])
    const empty = renderWithProviders(<SeriesLibraryPage />)
    expect(await screen.findByText('Nenhuma série no Sonarr')).toBeInTheDocument()
    empty.unmount()

    vi.mocked(api.fetchSeriesList).mockResolvedValue([acao, wire])
    renderWithProviders(<SeriesLibraryPage />, { route: '/sonarr?q=xyz' })
    expect(await screen.findByText('Nenhuma série com esse nome')).toBeInTheDocument()
  })

  it('shows the spinner on first load', () => {
    vi.mocked(api.fetchSeriesList).mockReturnValue(new Promise(() => {}))
    renderWithProviders(<SeriesLibraryPage />)
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
    expect(cards()).toHaveLength(0)
  })

  it('shows the server error on 502 and not configured on 503', async () => {
    vi.mocked(api.fetchSeriesList).mockRejectedValue(httpError(502, 'Sonarr indisponível em http://sonarr:8989: timeout'))
    const failing = renderWithProviders(<SeriesLibraryPage />)
    expect(await screen.findByText('Sonarr indisponível em http://sonarr:8989: timeout')).toBeInTheDocument()
    failing.unmount()

    vi.mocked(api.fetchSeriesList).mockRejectedValue(httpError(503, 'Sonarr não configurado (SONARR_URL ausente)'))
    renderWithProviders(<SeriesLibraryPage />)
    expect(await screen.findByText('Sonarr não configurado')).toBeInTheDocument()
  })
})
