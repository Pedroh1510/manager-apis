import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddMangaWizard } from './AddMangaWizard'
import * as api from '../services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api')

const DOWNLOADING_MESSAGE =
  'Catálogo deste plugin ainda não foi baixado. O download começou — clique em Próximo novamente em alguns minutos.'

function renderWizard(onAdd = vi.fn()) {
  renderWithProviders(<AddMangaWizard isAdding={false} onAdd={onAdd} onCancel={vi.fn()} />)
  return onAdd
}

async function choosePluginAndClickNext() {
  await screen.findByRole('option', { name: 'TCB Scans' })
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'tcb' } })
  fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.fetchPlugins).mockResolvedValue([{ id: 'tcb', name: 'TCB Scans' }])
})

describe('AddMangaWizard', () => {
  it('keeps the plugin, manga and confirm steps and the catalog-downloading message', async () => {
    vi.mocked(api.fetchMangasByPlugin)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([{ id: 'a1', title: 'Manga A' }])
    const onAdd = renderWizard()

    await choosePluginAndClickNext()
    expect(await screen.findByText(DOWNLOADING_MESSAGE)).toBeInTheDocument()
    expect(screen.getByText('Selecione um plugin')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/filtrar manga/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Manga A' }))
    expect(screen.getByText(/título no plugin/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^adicionar$/i }))
    expect(onAdd).toHaveBeenCalledWith({
      title: 'Manga A',
      idPlugin: 'tcb',
      idMangaPlugin: 'a1',
      titlePlugin: 'Manga A',
    })
    // The wizard does not reset itself: the page closes it once the mutation succeeds.
    expect(screen.getByText(/título no plugin/i)).toBeInTheDocument()
  })

  it('shows plugin filter input and filters plugins', async () => {
    vi.mocked(api.fetchPlugins).mockResolvedValue([
      { id: 'tcb', name: 'TCB Scans' },
      { id: 'other', name: 'Other Source' },
    ])
    renderWizard()
    await screen.findByRole('option', { name: 'Other Source' })

    fireEvent.change(screen.getByPlaceholderText(/filtrar plugin/i), { target: { value: 'TCB' } })
    expect(screen.getByRole('option', { name: 'TCB Scans' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Other Source' })).not.toBeInTheDocument()
  })

  it('shows plugin id as fallback when plugin name is empty', async () => {
    vi.mocked(api.fetchPlugins).mockResolvedValue([
      { id: 'tcb', name: 'TCB Scans' },
      { id: 'no-name-plugin', name: '' },
    ])
    renderWizard()

    expect(await screen.findByRole('option', { name: 'no-name-plugin' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'TCB Scans' })).toBeInTheDocument()
  })

  it('retries on Próximo and moves to manga selection once the catalog is ready', async () => {
    vi.mocked(api.fetchMangasByPlugin)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([{ id: 'n1', title: 'Naruto' }])
    renderWizard()
    await choosePluginAndClickNext()
    await screen.findByText(DOWNLOADING_MESSAGE)

    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    await waitFor(() => expect(screen.getByText('Naruto')).toBeInTheDocument())
    expect(api.fetchMangasByPlugin).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(DOWNLOADING_MESSAGE)).not.toBeInTheDocument()
  })

  const PICO = { id: 'pico marcial/x', title: 'Pico Marcial' }
  const picoCoverUrl = `${import.meta.env.VITE_MANGAS_API_URL}/mangas/tcb/cover/pico%20marcial%2Fx`

  async function openCatalogWithPico() {
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([PICO, { id: 'n1', title: 'Naruto' }])
    renderWizard()
    await choosePluginAndClickNext()
    return screen.findByRole('button', { name: 'Pico Marcial' })
  }

  it('shows a lazy cover thumbnail for each catalog item', async () => {
    const item = await openCatalogWithPico()

    const thumbnail = item.closest('li')!.querySelector('img')!
    expect(thumbnail).toHaveAttribute('src', picoCoverUrl)
    expect(thumbnail).toHaveAttribute('width', '48')
    expect(thumbnail).toHaveAttribute('height', '68')
    expect(thumbnail).toHaveAttribute('loading', 'lazy')
  })

  it('opens the cover popover on hover and on keyboard focus', async () => {
    const user = userEvent.setup()
    const item = await openCatalogWithPico()

    await user.hover(item)
    const popover = screen.getByRole('tooltip')
    expect(within(popover).getByRole('img', { name: 'Capa de Pico Marcial' })).toHaveAttribute('src', picoCoverUrl)
    await user.unhover(item)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    act(() => item.focus())
    expect(within(screen.getByRole('tooltip')).getByRole('img', { name: 'Capa de Pico Marcial' })).toBeInTheDocument()
    act(() => item.blur())
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the chosen manga cover on the confirm step', async () => {
    const item = await openCatalogWithPico()

    fireEvent.click(item)

    const cover = await screen.findByRole('img', { name: 'Capa de Pico Marcial' })
    expect(cover).toHaveAttribute('src', picoCoverUrl)
  })

  it('filters mangas by title in select-manga step and shows no-results', async () => {
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([
      { id: 'n1', title: 'Naruto' },
      { id: 'op1', title: 'One Piece' },
    ])
    renderWizard()
    await choosePluginAndClickNext()
    await screen.findByText('Naruto')

    fireEvent.change(screen.getByPlaceholderText(/filtrar manga/i), { target: { value: 'Naruto' } })
    expect(screen.getByText('Naruto')).toBeInTheDocument()
    expect(screen.queryByText('One Piece')).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/filtrar manga/i), { target: { value: 'zzznomatch' } })
    expect(screen.getByText(/nenhum mangá disponível/i)).toBeInTheDocument()
    expect(screen.queryByText('Naruto')).not.toBeInTheDocument()
  })

  it('deduplicates mangas with the same title from the API', async () => {
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([
      { id: 'n1', title: 'Naruto' },
      { id: 'op1', title: 'One Piece' },
      { id: 'n1', title: 'Naruto' },
    ])
    renderWizard()
    await choosePluginAndClickNext()
    await screen.findByText('Naruto')

    expect(screen.getAllByRole('button', { name: 'Naruto' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'One Piece' })).toBeInTheDocument()
  })
})
