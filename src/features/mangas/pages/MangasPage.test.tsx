import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MangasListPage } from './MangasPage'
import * as api from '../services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { connector, manga, PLUGINS } from '../test/fixtures'

vi.mock('../services/api')

const NARUTO = manga(1, 'Naruto', [connector('tcb', true)])
const ONE_PIECE = manga(2, 'One Piece', [connector('mangeek', false)])
const BLEACH = manga(3, 'Bleach', [connector('tcb', true), connector('mangeek', false)])

function renderPage(route = '/mangas/list') {
  return renderWithProviders(<MangasListPage />, { route })
}

const location = () => screen.getByTestId('location').textContent ?? ''
const titles = () => screen.queryAllByTestId('manga-title').map((cell) => cell.textContent)

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.fetchPlugins).mockResolvedValue(PLUGINS)
  vi.mocked(api.fetchMangaList).mockResolvedValue([NARUTO, ONE_PIECE, BLEACH])
})

describe('MangasListPage', () => {
  it('shows placeholder rows while loading', () => {
    vi.mocked(api.fetchMangaList).mockReturnValue(new Promise(() => {}))
    renderPage()

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getAllByTestId('placeholder-row').length).toBeGreaterThan(0)
    expect(screen.queryByText('Naruto')).not.toBeInTheDocument()
  })

  it('shows the error with a retry button', async () => {
    vi.mocked(api.fetchMangaList).mockRejectedValueOnce(new Error('Network Error'))
    renderPage()

    const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
    expect(screen.getByText(/Network Error/)).toBeInTheDocument()
    fireEvent.click(retry)

    await screen.findByText('Naruto')
    expect(api.fetchMangaList).toHaveBeenCalledTimes(2)
  })

  it('shows the empty state when no manga is registered', async () => {
    vi.mocked(api.fetchMangaList).mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('Nenhum mangá cadastrado')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Adicionar mangá' }).length).toBeGreaterThan(0)
  })

  it('filters by title, connector and status and writes them to the URL', async () => {
    renderPage()
    await screen.findByText('Naruto')

    fireEvent.change(screen.getByLabelText('Filtrar por título'), { target: { value: 'naru' } })
    expect(titles()).toEqual(['Naruto'])
    expect(location()).toContain('q=naru')

    fireEvent.change(screen.getByLabelText('Filtrar por título'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Conector'), { target: { value: 'mangeek' } })
    expect(titles()).toEqual(['One Piece', 'Bleach'])
    expect(location()).toContain('plugin=mangeek')

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'partial' } })
    expect(titles()).toEqual(['Bleach'])
    expect(location()).toContain('status=partial')
  })

  it('starts with the filters read from the URL', async () => {
    renderPage('/mangas/list?q=one&plugin=mangeek&status=inactive')
    await screen.findByText('One Piece')

    expect(screen.getByLabelText('Filtrar por título')).toHaveValue('one')
    expect(screen.getByLabelText('Conector')).toHaveValue('mangeek')
    expect(screen.getByLabelText('Status')).toHaveValue('inactive')
    expect(titles()).toEqual(['One Piece'])
  })

  it('shows the no-match state and clears the filters', async () => {
    renderPage('/mangas/list?q=zzz&plugin=tcb&status=active')

    expect(await screen.findByText('Nenhum mangá com esses filtros')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(location()).toEqual('/mangas/list')
    expect(titles()).toEqual(['Naruto', 'One Piece', 'Bleach'])
  })

  it('keeps the previous state and shows the API message when a toggle fails', async () => {
    vi.mocked(api.setAllConnectorsActive).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Manga 1 has no connector links' } },
      message: 'Request failed with status code 400',
    })
    renderPage()
    await screen.findByText('Naruto')

    const narutoRow = screen.getByText('Naruto').closest('tr') as HTMLElement
    fireEvent.click(within(narutoRow).getByRole('switch', { name: 'Ativar ou desativar Naruto' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Manga 1 has no connector links')
    expect(within(narutoRow).getByText('Ativo')).toBeInTheDocument()
  })

  it('closes the drawer and refreshes the list after adding a manga', async () => {
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([{ id: 'dd1', title: 'Dandadan' }])
    vi.mocked(api.addManga).mockResolvedValue({ idManga: 9 })
    vi.mocked(api.linkConnector).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Naruto')

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar mangá' }))
    const drawer = screen.getByRole('dialog', { name: 'Adicionar mangá' })
    await within(drawer).findByRole('option', { name: 'TCB' })
    fireEvent.change(within(drawer).getByRole('combobox'), { target: { value: 'tcb' } })
    fireEvent.click(within(drawer).getByRole('button', { name: /próximo/i }))
    fireEvent.click(await within(drawer).findByRole('button', { name: 'Dandadan' }))
    vi.mocked(api.fetchMangaList).mockClear()
    fireEvent.click(within(drawer).getByRole('button', { name: /^adicionar$/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByRole('status')).toBeInTheDocument()
    await waitFor(() => expect(api.fetchMangaList).toHaveBeenCalled())
  })

  it('deletes only after confirmation', async () => {
    vi.mocked(api.deleteManga).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Naruto')
    const narutoRow = () => screen.getByText('Naruto').closest('tr') as HTMLElement

    fireEvent.click(within(narutoRow()).getByRole('button', { name: 'Remover Naruto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(api.deleteManga).not.toHaveBeenCalled()

    fireEvent.click(within(narutoRow()).getByRole('button', { name: 'Remover Naruto' }))
    vi.mocked(api.fetchMangaList).mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(api.deleteManga).toHaveBeenCalledWith(1))
    expect(await screen.findByRole('status')).toBeInTheDocument()
    await waitFor(() => expect(api.fetchMangaList).toHaveBeenCalled())
  })
})
