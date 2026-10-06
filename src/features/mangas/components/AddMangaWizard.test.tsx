import { fireEvent, screen, waitFor } from '@testing-library/react'
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
