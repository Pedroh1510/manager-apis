import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ManualImportPage } from './ManualImportPage'
import * as api from '../services/api'
import type { ImportCandidate, SeriesDetail, SeriesSummary, StuckDownload } from '../services/types'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  fetchStuckDownloads: vi.fn(),
  fetchImportFiles: vi.fn(),
  startManualImport: vi.fn(),
  fetchCommandState: vi.fn(),
  fetchSeriesList: vi.fn(),
  fetchSeriesDetail: vi.fn(),
}))

const d1: StuckDownload = { downloadId: 'D1', title: 'Severance.S02.1080p', seriesTitle: 'Severance', state: 'importBlocked', messages: ['Unknown episode'], size: 1 }
const d2: StuckDownload = { downloadId: 'D2', title: 'random pack', seriesTitle: null, state: 'importPending', messages: [], size: 1 }
const recognized: ImportCandidate = {
  path: '/dl/Severance.S02E03.mkv', relativePath: 'Severance.S02E03.mkv', size: 1610612736, seriesId: 2, seriesTitle: 'Severance',
  episodes: [{ id: 119, seasonNumber: 2, episodeNumber: 3 }], quality: 'WEBDL-1080p', languages: ['English'], releaseGroup: null,
  rejections: ['Unable to determine if file is a sample'],
}
const unknown: ImportCandidate = {
  path: '/dl/random name 07.mkv', relativePath: 'random name 07.mkv', size: 1000, seriesId: null, seriesTitle: null, episodes: [],
  quality: 'HDTV-720p', languages: ['Unknown'], releaseGroup: 'mi', rejections: ['Unknown Series'],
}
const summary = (id: number, title: string): SeriesSummary => ({
  id, title, alternateTitles: [], year: 2000, status: 'ended', network: '', episodeFileCount: 0, episodeCount: 0, added: '',
})
const severanceDetail: SeriesDetail = {
  id: 2, title: 'Severance', year: 2022, status: 'continuing', network: '', overview: '', sizeOnDisk: 0, episodeFileCount: 0, episodeCount: 0,
  seasons: [
    { seasonNumber: 2, monitored: true, episodeFileCount: 0, episodeCount: 2, episodes: [
      { id: 123, episodeNumber: 7, title: 'Chikhai Bardo', airDateUtc: null, state: 'missing', monitored: true },
      { id: 124, episodeNumber: 8, title: 'Sweet Vitriol', airDateUtc: null, state: 'missing', monitored: true },
    ] },
    { seasonNumber: 1, monitored: true, episodeFileCount: 0, episodeCount: 1, episodes: [
      { id: 101, episodeNumber: 1, title: 'Good News About Hell', airDateUtc: null, state: 'missing', monitored: true },
    ] },
  ],
}
const httpError = (error: string) => ({ isAxiosError: true, response: { status: 404, data: { error } }, message: 'x' })

function renderPage() {
  return renderWithProviders(<ManualImportPage />, { route: '/sonarr/importar', path: '/sonarr/importar' })
}

async function openD1() {
  renderPage()
  fireEvent.click(await screen.findByRole('button', { name: 'Importar Severance.S02.1080p' }))
  const drawer = await screen.findByRole('dialog', { name: 'Importar — Severance.S02.1080p' })
  await within(drawer).findByRole('checkbox', { name: 'Importar Severance.S02E03.mkv' })
  return drawer
}

const rowOf = (drawer: HTMLElement, relativePath: string) =>
  within(drawer).getByRole('checkbox', { name: `Importar ${relativePath}` }).closest('tr') as HTMLElement

beforeEach(() => {
  vi.mocked(api.fetchStuckDownloads).mockReset().mockResolvedValue([d1, d2])
  vi.mocked(api.fetchImportFiles).mockReset().mockResolvedValue([recognized, unknown])
  vi.mocked(api.startManualImport).mockReset().mockResolvedValue(392)
  vi.mocked(api.fetchCommandState).mockReset().mockResolvedValue({ state: 'completed', message: 'Manually imported 1 files' })
  vi.mocked(api.fetchSeriesList).mockReset().mockResolvedValue([summary(1, 'The Wire'), summary(2, 'Severance')])
  vi.mocked(api.fetchSeriesDetail).mockReset().mockResolvedValue(severanceDetail)
})

afterEach(() => vi.useRealTimers())

describe('ManualImportPage', () => {
  it('lists stuck downloads with their messages', async () => {
    renderPage()
    const first = (await screen.findByRole('button', { name: 'Importar Severance.S02.1080p' })).closest('li') as HTMLElement
    expect(first).toHaveTextContent('Severance.S02.1080p')
    expect(within(first).getByText('Severance', { exact: true })).toBeInTheDocument()
    expect(first).toHaveTextContent('Unknown episode')
    const second = screen.getByRole('button', { name: 'Importar random pack' }).closest('li') as HTMLElement
    expect(second).toHaveTextContent('Série não reconhecida')
  })

  it('shows loading, empty and error states', async () => {
    vi.mocked(api.fetchStuckDownloads).mockReturnValue(new Promise(() => {}))
    const loading = renderPage()
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
    loading.unmount()

    vi.mocked(api.fetchStuckDownloads).mockResolvedValue([])
    const empty = renderPage()
    expect(await screen.findByText('Nenhum download aguardando importação')).toBeInTheDocument()
    empty.unmount()

    vi.mocked(api.fetchStuckDownloads).mockRejectedValue(httpError('Sonarr indisponível'))
    renderPage()
    expect(await screen.findByText('Sonarr indisponível')).toBeInTheDocument()
  })

  it('opens the download files with what sonarr recognized', async () => {
    const drawer = await openD1()
    expect(api.fetchImportFiles).toHaveBeenCalledWith({ downloadId: 'D1' })
    const known = rowOf(drawer, 'Severance.S02E03.mkv')
    expect(within(known).getByRole('checkbox', { name: 'Importar Severance.S02E03.mkv' })).toBeChecked()
    expect(known).toHaveTextContent('1.5 GB')
    expect(known).toHaveTextContent('WEBDL-1080p')
    expect(known).toHaveTextContent('English')
    expect(known).toHaveTextContent('Unable to determine if file is a sample')
    const other = rowOf(drawer, 'random name 07.mkv')
    expect(within(other).getByRole('checkbox', { name: 'Importar random name 07.mkv' })).not.toBeChecked()
    expect(other).toHaveTextContent('Unknown Series')
  })

  it('series select starts on the recognized series', async () => {
    const drawer = await openD1()
    const select = await within(drawer).findByRole('combobox', { name: 'Série de Severance.S02E03.mkv' })
    await waitFor(() => expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['Escolha a série', 'The Wire', 'Severance']))
    expect(select).toHaveValue('2')
    expect(within(drawer).getByRole('combobox', { name: 'Série de random name 07.mkv' })).toHaveValue('')
  })

  it('episodes picker lists the series episodes by season', async () => {
    const drawer = await openD1()
    expect(within(rowOf(drawer, 'Severance.S02E03.mkv')).getByText('S02E03', { exact: true })).toBeInTheDocument()
    expect(within(rowOf(drawer, 'random name 07.mkv')).getByText('Nenhum', { exact: true })).toBeInTheDocument()

    const select = within(drawer).getByRole('combobox', { name: 'Série de random name 07.mkv' })
    await within(select).findByRole('option', { name: 'Severance' })
    fireEvent.change(select, { target: { value: '2' } })
    fireEvent.click(within(drawer).getByRole('button', { name: 'Escolher episódios de random name 07.mkv' }))
    const picker = await within(drawer).findByRole('group', { name: 'Episódios de random name 07.mkv' })
    expect(within(picker).getAllByRole('heading').map((heading) => heading.textContent)).toEqual(['Temporada 2', 'Temporada 1'])
    fireEvent.click(within(picker).getByRole('checkbox', { name: 'S02E07 — Chikhai Bardo' }))
    fireEvent.click(within(picker).getByRole('checkbox', { name: 'S02E08 — Sweet Vitriol' }))
    expect(within(rowOf(drawer, 'random name 07.mkv')).getByText('S02E07, S02E08', { exact: true })).toBeInTheDocument()
    expect(within(drawer).getByRole('checkbox', { name: 'Importar random name 07.mkv' })).toBeChecked()
    expect(within(drawer).getByRole('button', { name: 'Importar (2)' })).toBeEnabled()
    expect(api.fetchSeriesDetail).toHaveBeenCalledWith(2)
  })

  it('changing the series clears the episodes', async () => {
    const drawer = await openD1()
    const select = within(drawer).getByRole('combobox', { name: 'Série de Severance.S02E03.mkv' })
    await within(select).findByRole('option', { name: 'The Wire' })
    fireEvent.change(select, { target: { value: '1' } })
    expect(within(rowOf(drawer, 'Severance.S02E03.mkv')).getByText('Nenhum', { exact: true })).toBeInTheDocument()
  })

  it('import button counts checked files and needs complete rows', async () => {
    const drawer = await openD1()
    expect(within(drawer).getByRole('button', { name: 'Importar (1)' })).toBeEnabled()
    fireEvent.click(within(drawer).getByRole('checkbox', { name: 'Importar random name 07.mkv' }))
    expect(within(drawer).getByRole('button', { name: 'Importar (2)' })).toBeDisabled()
    fireEvent.click(within(drawer).getByRole('checkbox', { name: 'Importar random name 07.mkv' }))
    fireEvent.click(within(drawer).getByRole('checkbox', { name: 'Importar Severance.S02E03.mkv' }))
    expect(within(drawer).getByRole('button', { name: 'Importar (0)' })).toBeDisabled()
  })

  it('imports the checked files and polls the command every 2s', async () => {
    vi.mocked(api.fetchCommandState).mockResolvedValue({ state: 'pending', message: null })
    const drawer = await openD1()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fireEvent.click(within(drawer).getByRole('button', { name: 'Importar (1)' }))

    await waitFor(() => expect(api.startManualImport).toHaveBeenCalledWith({ downloadId: 'D1' }, [{ path: '/dl/Severance.S02E03.mkv', seriesId: 2, episodeIds: [119] }]))
    expect(within(drawer).getByRole('button', { name: 'Importando…' })).toBeDisabled()
    expect(api.fetchCommandState).not.toHaveBeenCalled()
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(api.fetchCommandState).toHaveBeenCalledTimes(1)
    expect(api.fetchCommandState).toHaveBeenCalledWith(392)
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(api.fetchCommandState).toHaveBeenCalledTimes(2)
  })

  it('a finished command closes on success and stays open on failure', async () => {
    const drawer = await openD1()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fireEvent.click(within(drawer).getByRole('button', { name: 'Importar (1)' }))
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(await screen.findByRole('status', { name: '' })).toHaveTextContent('Manually imported 1 files')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(api.fetchStuckDownloads).toHaveBeenCalledTimes(2))

    vi.mocked(api.fetchCommandState).mockResolvedValue({ state: 'failed', message: null })
    fireEvent.click(await screen.findByRole('button', { name: 'Importar Severance.S02.1080p' }))
    const again = await screen.findByRole('dialog', { name: 'Importar — Severance.S02.1080p' })
    fireEvent.click(await within(again).findByRole('button', { name: 'Importar (1)' }))
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(await screen.findByRole('alert')).toHaveTextContent('Importação falhou no Sonarr')
    expect(screen.getByRole('dialog', { name: 'Importar — Severance.S02.1080p' })).toBeInTheDocument()
  })

  it('send or poll failures stop and show the error', async () => {
    vi.mocked(api.startManualImport).mockRejectedValueOnce(httpError('arquivo não encontrado no download D1: x'))
    const drawer = await openD1()
    fireEvent.click(within(drawer).getByRole('button', { name: 'Importar (1)' }))
    expect(await screen.findByText('arquivo não encontrado no download D1: x')).toBeInTheDocument()
    await waitFor(() => expect(within(drawer).getByRole('button', { name: 'Importar (1)' })).toBeEnabled())

    vi.mocked(api.fetchCommandState).mockRejectedValue(httpError('comando 392 não encontrado no Sonarr'))
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fireEvent.click(within(drawer).getByRole('button', { name: 'Importar (1)' }))
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(await screen.findByText('comando 392 não encontrado no Sonarr')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(4000))
    expect(api.fetchCommandState).toHaveBeenCalledTimes(1)
    expect(within(drawer).getByRole('button', { name: 'Importar (1)' })).toBeEnabled()
  })
})
