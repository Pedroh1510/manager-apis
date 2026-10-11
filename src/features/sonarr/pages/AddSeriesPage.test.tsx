import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddSeriesPage } from './AddSeriesPage'
import * as api from '../services/api'
import type { AddOptions, SeriesLookupResult } from '../services/types'
import { ADD_SERIES_PREFS_KEY } from '../lib/addSeriesPrefs'
import { MemoryPrefsStorage } from '../../../test/MemoryPrefsStorage'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  lookupSeries: vi.fn(),
  fetchAddOptions: vi.fn(),
  addSeries: vi.fn(),
}))

const result = (overrides: Partial<SeriesLookupResult>): SeriesLookupResult => ({
  tvdbId: 1, title: 'X', year: 2020, network: null, overview: null, genres: [], remotePoster: null, seriesId: null, ...overrides,
})
const wire = result({ tvdbId: 79126, title: 'The Wire', year: 2002, network: 'HBO', overview: 'Baltimore.', remotePoster: 'https://artworks.thetvdb.com/wire.jpg', seriesId: 1 })
const severance = result({ tvdbId: 371980, title: 'Severance', year: 2022, network: 'Apple TV', overview: 'Mark leads a team.', remotePoster: 'https://artworks.thetvdb.com/sev.jpg', genres: ['Drama'] })
const frieren = result({ tvdbId: 424536, title: 'Frieren', year: 2023, genres: ['Animation', 'Anime'] })
const options: AddOptions = {
  qualityProfiles: [{ id: 1, name: 'Any' }, { id: 4, name: 'HD-1080p' }],
  rootFolders: [{ path: '/tv', freeSpace: 1 }, { path: '/anime', freeSpace: 1 }],
}
const httpError = (error: string) => ({ isAxiosError: true, response: { status: 409, data: { error } }, message: 'x' })

function renderPage(route = '/sonarr/adicionar?q=wire', storage = new MemoryPrefsStorage()) {
  renderWithProviders(<AddSeriesPage prefsStorage={storage} />, { route, path: '/sonarr/adicionar' })
  return storage
}

async function openForm(series = severance) {
  vi.mocked(api.lookupSeries).mockResolvedValue([wire, series])
  const storage = renderPage()
  fireEvent.click(await screen.findByRole('button', { name: `Adicionar ${series.title}` }))
  const drawer = await screen.findByRole('dialog', { name: `Adicionar — ${series.title} (${series.year})` })
  await within(drawer).findByLabelText('Quality profile')
  return { drawer, storage }
}

beforeEach(() => {
  vi.mocked(api.lookupSeries).mockReset().mockResolvedValue([wire, severance])
  vi.mocked(api.fetchAddOptions).mockReset().mockResolvedValue(options)
  vi.mocked(api.addSeries).mockReset().mockResolvedValue(7)
})

describe('AddSeriesPage', () => {
  it('searches on submit and keeps the term in q', async () => {
    renderPage('/sonarr/adicionar?q=wire')
    await waitFor(() => expect(api.lookupSeries).toHaveBeenCalledWith('wire'))

    fireEvent.change(screen.getByLabelText('Buscar série'), { target: { value: 'severance' } })
    fireEvent.submit(screen.getByLabelText('Buscar série').closest('form') as HTMLFormElement)
    await waitFor(() => expect(api.lookupSeries).toHaveBeenCalledWith('severance'))
    expect(screen.getByTestId('location')).toHaveTextContent('/sonarr/adicionar?q=severance')

    fireEvent.change(screen.getByLabelText('Buscar série'), { target: { value: 'frieren' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    await waitFor(() => expect(api.lookupSeries).toHaveBeenCalledWith('frieren'))
  })

  it('shows loading, empty and error states', async () => {
    vi.mocked(api.lookupSeries).mockReturnValue(new Promise(() => {}))
    const { unmount } = renderWithProviders(<AddSeriesPage prefsStorage={null} />, { route: '/sonarr/adicionar?q=a' })
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
    unmount()

    vi.mocked(api.lookupSeries).mockResolvedValue([])
    const empty = renderWithProviders(<AddSeriesPage prefsStorage={null} />, { route: '/sonarr/adicionar?q=a' })
    expect(await screen.findByText('Nenhuma série encontrada')).toBeInTheDocument()
    empty.unmount()

    vi.mocked(api.lookupSeries).mockRejectedValue(httpError('Sonarr indisponível'))
    renderWithProviders(<AddSeriesPage prefsStorage={null} />, { route: '/sonarr/adicionar?q=a' })
    expect(await screen.findByText('Sonarr indisponível')).toBeInTheDocument()
  })

  it('renders a card per result with the remote poster', async () => {
    vi.mocked(api.lookupSeries).mockResolvedValue([severance, frieren])
    renderPage()
    const card = await screen.findByRole('button', { name: 'Adicionar Severance' })
    expect(within(card).getByRole('img', { name: 'Pôster de Severance' })).toHaveAttribute('src', 'https://artworks.thetvdb.com/sev.jpg')
    expect(card).toHaveTextContent('Severance')
    expect(card).toHaveTextContent('2022')
    expect(card).toHaveTextContent('Apple TV')
    expect(card).toHaveTextContent('Mark leads a team.')
    expect(within(screen.getByRole('button', { name: 'Adicionar Frieren' })).getByLabelText('Sem pôster: Frieren')).toHaveTextContent('F')

    fireEvent.error(within(card).getByRole('img'))
    expect(within(card).getByLabelText('Sem pôster: Severance')).toBeInTheDocument()
  })

  it('library series link to the detail instead of the form', async () => {
    renderPage()
    const link = await screen.findByRole('link', { name: 'Na biblioteca' })
    expect(link).toHaveAttribute('href', '/sonarr/1')
    expect(screen.queryByRole('button', { name: 'Adicionar The Wire' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('The Wire'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the add form with every field', async () => {
    const { drawer } = await openForm()
    const optionsOf = (label: string) => within(within(drawer).getByLabelText(label)).getAllByRole('option').map((option) => option.textContent)
    expect(optionsOf('Quality profile')).toEqual(['Any', 'HD-1080p'])
    expect(optionsOf('Pasta raiz')).toEqual(['/tv', '/anime'])
    expect(optionsOf('Tipo')).toEqual(['Padrão', 'Anime', 'Diário'])
    expect(optionsOf('Monitorar')).toEqual(['Todos', 'Futuros', 'Nenhum', '1ª temporada', 'Última temporada'])
    expect(within(drawer).getByRole('checkbox', { name: 'Buscar faltantes ao adicionar' })).toBeChecked()
    expect(within(drawer).getByLabelText('Tipo')).toHaveValue('standard')
  })

  it('type starts as anime for anime genres', async () => {
    const { drawer } = await openForm(frieren)
    expect(within(drawer).getByLabelText('Tipo')).toHaveValue('anime')
  })

  it('submits the form, disables while pending and saves the prefs', async () => {
    let finish!: (id: number) => void
    vi.mocked(api.addSeries).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const { drawer, storage } = await openForm()
    fireEvent.change(within(drawer).getByLabelText('Quality profile'), { target: { value: '4' } })
    fireEvent.change(within(drawer).getByLabelText('Pasta raiz'), { target: { value: '/anime' } })
    fireEvent.change(within(drawer).getByLabelText('Monitorar'), { target: { value: 'lastSeason' } })
    fireEvent.click(within(drawer).getByRole('checkbox', { name: 'Buscar faltantes ao adicionar' }))
    fireEvent.click(within(drawer).getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => expect(api.addSeries).toHaveBeenCalledWith({
      tvdbId: 371980, qualityProfileId: 4, rootFolderPath: '/anime', seriesType: 'standard', monitor: 'lastSeason', searchForMissingEpisodes: false,
    }))
    expect(within(drawer).getByRole('button', { name: 'Adicionar' })).toBeDisabled()
    expect(JSON.parse(storage.getItem(ADD_SERIES_PREFS_KEY) ?? 'null')).toEqual({
      qualityProfileId: 4, rootFolderPath: '/anime', monitor: 'lastSeason', searchForMissingEpisodes: false,
    })
    finish(7)
  })

  it('after adding stays on the search and marks the card', async () => {
    const { drawer } = await openForm()
    fireEvent.click(within(drawer).getByRole('button', { name: 'Adicionar' }))

    const toast = await screen.findByRole('status', { name: '' })
    expect(within(toast).getByRole('link', { name: 'Ver série' })).toHaveAttribute('href', '/sonarr/7')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Buscar série')).toHaveValue('wire')
    const links = screen.getAllByRole('link', { name: 'Na biblioteca' }).map((link) => link.getAttribute('href'))
    expect(links).toEqual(['/sonarr/1', '/sonarr/7'])
  })

  it('a failed add keeps the drawer open with an error toast', async () => {
    vi.mocked(api.addSeries).mockRejectedValue(httpError('série 371980 já está na biblioteca'))
    const { drawer } = await openForm()
    fireEvent.click(within(drawer).getByRole('button', { name: 'Adicionar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('série 371980 já está na biblioteca')
    expect(screen.getByRole('dialog', { name: 'Adicionar — Severance (2022)' })).toBeInTheDocument()
  })
})
