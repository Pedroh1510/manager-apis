import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MissingEpisodesPage } from './MissingEpisodesPage'
import * as api from '../services/api'
import type { MissingEpisode, MissingPage } from '../services/types'
import { formatDate } from '../../../lib/formatDate'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  fetchMissing: vi.fn(),
  searchEpisode: vi.fn(),
  searchEpisodes: vi.fn(),
  searchAllMissing: vi.fn(),
  fetchReleases: vi.fn(),
}))

const missing = (episodeId: number, episodeNumber: number): MissingEpisode => ({
  episodeId, seriesId: 1, seriesTitle: 'The Wire', seasonNumber: 5, episodeNumber, title: `Ep ${episodeNumber}`, airDateUtc: '2008-03-10T01:00:00Z',
})
const pageOf = (page: number, records = [missing(60, 10), missing(59, 9)], totalRecords = 45): MissingPage => ({ page, pageSize: 20, totalRecords, records })
const httpError = (error: string) => ({ isAxiosError: true, response: { status: 502, data: { error } }, message: 'x' })

function renderPage(route = '/sonarr/faltantes') {
  return renderWithProviders(<MissingEpisodesPage />, { route, path: '/sonarr/faltantes' })
}

const checkbox = (name: string) => screen.getByRole('checkbox', { name })

beforeEach(() => {
  vi.mocked(api.fetchMissing).mockReset().mockImplementation(async (page) => pageOf(page))
  for (const fn of [api.searchEpisode, api.searchEpisodes, api.searchAllMissing]) vi.mocked(fn).mockReset().mockResolvedValue()
  vi.mocked(api.fetchReleases).mockReset().mockResolvedValue([])
})

describe('MissingEpisodesPage', () => {
  it('renders a row per missing episode with its actions', async () => {
    renderPage()
    const row = (await screen.findByRole('checkbox', { name: 'Selecionar The Wire S05E10' })).closest('tr') as HTMLElement
    expect(within(row).getByRole('link', { name: 'The Wire' })).toHaveAttribute('href', '/sonarr/1')
    expect(row).toHaveTextContent('S05E10')
    expect(row).toHaveTextContent('Ep 10')
    expect(row).toHaveTextContent(formatDate('2008-03-10T01:00:00Z'))

    fireEvent.click(within(row).getByRole('button', { name: 'Buscar The Wire S05E10' }))
    await waitFor(() => expect(api.searchEpisode).toHaveBeenCalledWith(60))
    fireEvent.click(within(row).getByRole('button', { name: 'Busca interativa The Wire S05E10' }))
    expect(await screen.findByRole('dialog', { name: 'Releases — The Wire S05E10' })).toBeInTheDocument()
    await waitFor(() => expect(api.fetchReleases).toHaveBeenCalledWith({ episodeId: 60 }))
  })

  it('paginates through the url', async () => {
    renderPage()
    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument()
    expect(api.fetchMissing).toHaveBeenLastCalledWith(2)
    expect(screen.getByTestId('location')).toHaveTextContent('/sonarr/faltantes?page=2')
  })

  it('opens on the page from the url and disables next on the last', async () => {
    renderPage('/sonarr/faltantes?page=3')
    expect(await screen.findByText('Página 3 de 3')).toBeInTheDocument()
    expect(api.fetchMissing).toHaveBeenCalledWith(3)
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })

  it('shows loading, empty and error states', async () => {
    vi.mocked(api.fetchMissing).mockReturnValue(new Promise(() => {}))
    const loading = renderPage()
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
    loading.unmount()

    vi.mocked(api.fetchMissing).mockResolvedValue(pageOf(1, [], 0))
    const empty = renderPage()
    expect(await screen.findByText('Nenhum episódio faltando')).toBeInTheDocument()
    empty.unmount()

    vi.mocked(api.fetchMissing).mockRejectedValue(httpError('Sonarr indisponível'))
    renderPage()
    expect(await screen.findByText('Sonarr indisponível')).toBeInTheDocument()
  })

  it('selection is per page', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Selecionar todos da página' }))
    expect(checkbox('Selecionar The Wire S05E10')).toBeChecked()
    expect(checkbox('Selecionar The Wire S05E09')).toBeChecked()
    fireEvent.click(checkbox('Selecionar todos da página'))
    expect(checkbox('Selecionar The Wire S05E10')).not.toBeChecked()

    fireEvent.click(checkbox('Selecionar The Wire S05E10'))
    expect(screen.getByRole('button', { name: 'Buscar selecionados (1)' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    await screen.findByText('Página 2 de 3')
    expect(checkbox('Selecionar The Wire S05E10')).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Buscar selecionados (0)' })).toBeDisabled()
  })

  it('searches the selected episodes without confirming', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: 'Buscar selecionados (0)' })).toBeDisabled()
    fireEvent.click(checkbox('Selecionar The Wire S05E10'))
    fireEvent.click(checkbox('Selecionar The Wire S05E09'))
    fireEvent.click(screen.getByRole('button', { name: 'Buscar selecionados (2)' }))

    await waitFor(() => expect(api.searchEpisodes).toHaveBeenCalledWith([60, 59]))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByText('Busca enviada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buscar selecionados (0)' })).toBeDisabled()
  })

  it('search all asks first and errors become toasts', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Buscar todos' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Buscar 45 episódios faltantes?')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(api.searchAllMissing).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Buscar todos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(api.searchAllMissing).toHaveBeenCalled())
    expect(await screen.findByText('Busca enviada')).toBeInTheDocument()

    vi.mocked(api.searchEpisodes).mockRejectedValue(httpError('falha selecionados'))
    fireEvent.click(checkbox('Selecionar The Wire S05E10'))
    fireEvent.click(screen.getByRole('button', { name: 'Buscar selecionados (1)' }))
    expect(await screen.findByText('falha selecionados')).toBeInTheDocument()

    vi.mocked(api.searchAllMissing).mockRejectedValue(httpError('falha todos'))
    fireEvent.click(screen.getByRole('button', { name: 'Buscar todos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText('falha todos')).toBeInTheDocument()

    vi.mocked(api.searchEpisode).mockRejectedValue(httpError('falha linha'))
    fireEvent.click(screen.getByRole('button', { name: 'Buscar The Wire S05E09' }))
    expect(await screen.findByText('falha linha')).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(3)
  })
})
