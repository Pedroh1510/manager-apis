import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MangaDetailPage } from './MangaDetailPage'
import * as api from '../services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { connector, manga, PLUGINS } from '../test/fixtures'
import { formatDateTime } from '../../../lib/formatDate'

vi.mock('../services/api')

const NARUTO = manga(1, 'Naruto', [connector('tcb', true, 'Naruto')])
const DOWNLOADED_AT = '2026-10-01T10:00:00Z'
const CHAPTERS = [
  { idChapter: 5, idMangaConnector: 1, idChapterPlugin: 'c1', name: 'Cap 1', volume: '1.0000', downloadedAt: DOWNLOADED_AT },
  { idChapter: 6, idMangaConnector: 1, idChapterPlugin: 'c2', name: 'Cap 2', volume: '2.0000', downloadedAt: null },
]

function renderDetail(id = '1') {
  return renderWithProviders(<MangaDetailPage />, { route: `/mangas/${id}`, path: '/mangas/:idManga' })
}

const chapterRow = (name: string) => screen.getByText(name).closest('tr') as HTMLElement

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.fetchPlugins).mockResolvedValue(PLUGINS)
  vi.mocked(api.fetchMangaList).mockResolvedValue([NARUTO])
  vi.mocked(api.fetchChapters).mockResolvedValue(CHAPTERS)
})

describe('MangaDetailPage', () => {
  it('shows title, status and a toggle for every connector', async () => {
    vi.mocked(api.setConnectorActive).mockResolvedValue(undefined)
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Naruto' })).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('switch', { name: 'Conector TCB de Naruto' }))
    await waitFor(() => expect(api.setConnectorActive).toHaveBeenCalledWith(1, 'tcb', false))
  })

  it('lists chapters with volume, name and download date', async () => {
    renderDetail()

    await screen.findByText('Cap 1')
    expect(within(chapterRow('Cap 1')).getByText('1')).toBeInTheDocument()
    expect(within(chapterRow('Cap 1')).getByText(formatDateTime(DOWNLOADED_AT))).toBeInTheDocument()
    expect(within(chapterRow('Cap 2')).getByText('2')).toBeInTheDocument()
    expect(within(chapterRow('Cap 2')).getByText('não baixado')).toBeInTheDocument()
  })

  it('shows the empty chapters state', async () => {
    vi.mocked(api.fetchChapters).mockResolvedValue([])
    renderDetail()

    expect(await screen.findByText('Nenhum capítulo registrado')).toBeInTheDocument()
  })

  it('loads missing chapters only on demand', async () => {
    vi.mocked(api.fetchMissingChapters)
      .mockResolvedValueOnce([{ id: 'm3', title: 'Cap 3', volume: 3, idMangaConnector: 1 }])
      .mockResolvedValueOnce([])
    renderDetail()
    await screen.findByText('Cap 1')
    expect(api.fetchMissingChapters).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Verificar faltantes' }))
    expect(await screen.findByText('Cap 3')).toBeInTheDocument()
    expect(api.fetchMissingChapters).toHaveBeenCalledTimes(1)
    expect(api.fetchMissingChapters).toHaveBeenCalledWith(1)

    fireEvent.click(screen.getByRole('button', { name: 'Verificar faltantes' }))
    expect(await screen.findByText('Nenhum capítulo faltando')).toBeInTheDocument()
  })

  it('enqueues a chapter that is not downloaded', async () => {
    vi.mocked(api.fetchChapterPages).mockResolvedValue(undefined)
    renderDetail()
    await screen.findByText('Cap 1')

    expect(within(chapterRow('Cap 1')).queryByRole('button', { name: /baixar/i })).not.toBeInTheDocument()
    fireEvent.click(within(chapterRow('Cap 2')).getByRole('button', { name: 'Baixar Cap 2' }))

    await waitFor(() => expect(api.fetchChapterPages).toHaveBeenCalledWith(1, 6))
    expect(await screen.findByRole('status')).toHaveTextContent('Capítulo enfileirado')
  })

  it('deletes a chapter only after confirmation', async () => {
    vi.mocked(api.deleteChapter).mockResolvedValue(undefined)
    renderDetail()
    await screen.findByText('Cap 1')

    fireEvent.click(within(chapterRow('Cap 1')).getByRole('button', { name: 'Remover Cap 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(api.deleteChapter).not.toHaveBeenCalled()

    fireEvent.click(within(chapterRow('Cap 1')).getByRole('button', { name: 'Remover Cap 1' }))
    vi.mocked(api.fetchChapters).mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(api.deleteChapter).toHaveBeenCalledWith(1, 5))
    expect(await screen.findByRole('status')).toBeInTheDocument()
    await waitFor(() => expect(api.fetchChapters).toHaveBeenCalled())
  })

  it('links the zip download to the API', async () => {
    renderDetail()
    await screen.findByRole('heading', { name: 'Naruto' })

    expect(screen.getByRole('link', { name: 'Baixar zip' })).toHaveAttribute(
      'href',
      `${import.meta.env.VITE_MANGAS_API_URL}/mangas/adm/1/download`
    )
  })

  it('shows not found for an unknown id', async () => {
    renderDetail('999')

    expect(await screen.findByText('Mangá não encontrado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /voltar para a lista/i })).toHaveAttribute('href', '/mangas/list')
  })

  const failure = { isAxiosError: true, response: { data: { message: 'boom' } }, message: 'x' }
  // Toasts live in the provider's region; inline page notices are not toasts.
  const toastAlerts = () =>
    screen.queryAllByRole('alert').filter((el) => el.closest('[data-toast-region]') && el.textContent?.includes('boom'))

  it('shows the API message for every failing call', async () => {
    vi.mocked(api.fetchMissingChapters).mockRejectedValue(failure)
    vi.mocked(api.fetchChapterPages).mockRejectedValue(failure)
    vi.mocked(api.deleteChapter).mockRejectedValue(failure)
    vi.mocked(api.setConnectorActive).mockRejectedValue(failure)
    renderDetail()
    await screen.findByText('Cap 1')

    fireEvent.click(screen.getByRole('button', { name: 'Verificar faltantes' }))
    fireEvent.click(within(chapterRow('Cap 2')).getByRole('button', { name: 'Baixar Cap 2' }))
    fireEvent.click(within(chapterRow('Cap 1')).getByRole('button', { name: 'Remover Cap 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    fireEvent.click(await screen.findByRole('switch', { name: 'Conector TCB de Naruto' }))

    await waitFor(() => expect(toastAlerts()).toHaveLength(4))
    expect(screen.getByTestId('location')).toHaveTextContent('/mangas/1')
  })

  it('shows the API message for every failing call (chapter list)', async () => {
    vi.mocked(api.fetchChapters).mockRejectedValue(failure)
    renderDetail()

    await waitFor(() => expect(toastAlerts()).toHaveLength(1))
    expect(screen.getByTestId('location')).toHaveTextContent('/mangas/1')
  })

  it('shows the API message for every failing call (plugins)', async () => {
    vi.mocked(api.fetchPlugins).mockRejectedValue(failure)
    renderDetail()

    await waitFor(() => expect(toastAlerts()).toHaveLength(1))
    expect(screen.getByRole('heading', { name: 'Naruto' })).toBeInTheDocument()
  })

  it('shows the API message for every failing call (manga list)', async () => {
    vi.mocked(api.fetchMangaList).mockRejectedValue(failure)
    renderDetail()

    await waitFor(() => expect(toastAlerts()).toHaveLength(1))
    expect(screen.getByText('Não foi possível carregar o mangá')).toBeInTheDocument()
    expect(screen.queryByText('Mangá não encontrado')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/mangas/1')
  })

  it('shows placeholder rows while loading', () => {
    vi.mocked(api.fetchMangaList).mockReturnValue(new Promise(() => {}))
    renderDetail()

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getAllByTestId('placeholder-row').length).toBeGreaterThan(0)
  })
})
