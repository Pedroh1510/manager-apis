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
  id: 2, title: 'Ação Total', alternateTitles: ['Action Total'], year: 2021, status: 'continuing', network: 'X', episodeFileCount: 10, episodeCount: 12, added: '2024-03-01T10:00:00Z',
}
const wire: SeriesSummary = {
  id: 1, title: 'The Wire', alternateTitles: [], year: 2002, status: 'ended', network: 'HBO', episodeFileCount: 60, episodeCount: 60, added: '2020-01-01T10:00:00Z',
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

  describe('status filter and sort', () => {
    const lost: SeriesSummary = { ...wire, id: 3, title: 'Lost', status: 'continuing', year: 2010, episodeFileCount: 1, episodeCount: 20, added: '2022-01-01T00:00:00Z' }
    const soon: SeriesSummary = { ...wire, id: 4, title: 'Soon', status: 'upcoming', year: 2027, episodeFileCount: 0, episodeCount: 0, added: '2023-01-01T00:00:00Z' }
    const library = [acao, lost, soon, wire]
    const titles = () => cards().map((link) => within(link).getByText(/^(Ação Total|Lost|Soon|The Wire)$/).textContent)
    const statusButton = (name: RegExp) => screen.getByRole('button', { name })

    it('shows status filters with counts', async () => {
      vi.mocked(api.fetchSeriesList).mockResolvedValue(library)
      renderWithProviders(<SeriesLibraryPage />)
      await screen.findByText('Lost')

      const group = screen.getByRole('group', { name: 'Status' })
      expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['Todas (4)', 'Continuando (2)', 'Encerrada (1)', 'Em breve (1)'])
      expect(statusButton(/^Todas/)).toHaveAttribute('aria-pressed', 'true')
    })

    it('filters by status combined with name and reads it from the url', async () => {
      vi.mocked(api.fetchSeriesList).mockResolvedValue(library)
      const first = renderWithProviders(<SeriesLibraryPage />)
      await screen.findByText('Lost')

      fireEvent.click(statusButton(/^Continuando/))
      expect(titles()).toEqual(['Ação Total', 'Lost'])
      expect(screen.getByTestId('location')).toHaveTextContent('status=continuing')
      fireEvent.change(screen.getByRole('textbox', { name: 'Filtrar por nome' }), { target: { value: 'lost' } })
      expect(titles()).toEqual(['Lost'])
      first.unmount()

      const ended = renderWithProviders(<SeriesLibraryPage />, { route: '/sonarr?status=ended' })
      await screen.findByText('The Wire')
      expect(statusButton(/^Encerrada/)).toHaveAttribute('aria-pressed', 'true')
      expect(titles()).toEqual(['The Wire'])
      ended.unmount()

      renderWithProviders(<SeriesLibraryPage />, { route: '/sonarr?status=xyz' })
      await screen.findByText('Lost')
      expect(statusButton(/^Todas/)).toHaveAttribute('aria-pressed', 'true')
      expect(cards()).toHaveLength(4)
    })

    it('sorts the grid and keeps the sort in the url', async () => {
      vi.mocked(api.fetchSeriesList).mockResolvedValue(library)
      const first = renderWithProviders(<SeriesLibraryPage />)
      await screen.findByText('Lost')
      const select = screen.getByRole('combobox', { name: 'Ordenar por' })

      fireEvent.change(select, { target: { value: 'missing' } })
      expect(titles()).toEqual(['Lost', 'Ação Total', 'Soon', 'The Wire'])
      expect(screen.getByTestId('location')).toHaveTextContent('sort=missing')
      fireEvent.change(select, { target: { value: 'title' } })
      expect(screen.getByTestId('location')).not.toHaveTextContent('sort=')
      first.unmount()

      renderWithProviders(<SeriesLibraryPage />, { route: '/sonarr?sort=year' })
      await screen.findByText('Lost')
      expect(screen.getByRole('combobox', { name: 'Ordenar por' })).toHaveValue('year')
      expect(titles()).toEqual(['Soon', 'Ação Total', 'Lost', 'The Wire'])
    })
  })
})
