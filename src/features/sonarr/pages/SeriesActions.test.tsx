import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SeriesDetailPage } from './SeriesDetailPage'
import * as api from '../services/api'
import type { EpisodeDetail, SeriesDetail } from '../services/types'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  fetchSeriesDetail: vi.fn(),
  setEpisodesMonitored: vi.fn(),
  setSeasonMonitored: vi.fn(),
  searchEpisode: vi.fn(),
  searchSeason: vi.fn(),
}))

const episode = (id: number, episodeNumber: number, monitored: boolean): EpisodeDetail => ({
  id, episodeNumber, title: `E${episodeNumber}`, airDateUtc: null, state: 'missing', monitored,
})

const wire: SeriesDetail = {
  id: 1, title: 'The Wire', year: 2002, status: 'ended', network: 'HBO', overview: '', sizeOnDisk: 0, episodeFileCount: 0, episodeCount: 0,
  seasons: [
    { seasonNumber: 2, monitored: true, episodeFileCount: 0, episodeCount: 1, episodes: [episode(21, 1, true)] },
    { seasonNumber: 1, monitored: false, episodeFileCount: 0, episodeCount: 2, episodes: [episode(11, 3, false), episode(12, 4, true)] },
    { seasonNumber: 0, monitored: false, episodeFileCount: 0, episodeCount: 0, episodes: [] },
  ],
}

const httpError = (error: string) => ({ isAxiosError: true, response: { status: 502, data: { error } }, message: 'x' })
const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((r) => { resolve = r })
  return { promise, resolve }
}

async function renderOpenSeasonOne() {
  renderWithProviders(<SeriesDetailPage />, { route: '/sonarr/1', path: '/sonarr/:seriesId' })
  await screen.findByRole('heading', { level: 1, name: 'The Wire' })
  fireEvent.click(screen.getByRole('button', { name: /^Temporada 1/ }))
}

beforeEach(() => {
  vi.mocked(api.fetchSeriesDetail).mockReset().mockResolvedValue(wire)
  for (const fn of [api.setEpisodesMonitored, api.setSeasonMonitored, api.searchEpisode, api.searchSeason]) vi.mocked(fn).mockReset().mockResolvedValue()
})

describe('series detail actions', () => {
  it('shows an episode monitor switch per row', async () => {
    await renderOpenSeasonOne()
    expect(screen.getByRole('switch', { name: 'Monitorar S01E03' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('switch', { name: 'Monitorar S01E04' })).toHaveAttribute('aria-checked', 'true')
  })

  it('shows a season monitor switch in each header', async () => {
    await renderOpenSeasonOne()
    expect(screen.getByRole('switch', { name: 'Monitorar Temporada 1' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('switch', { name: 'Monitorar Temporada 2' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: 'Monitorar Especiais' })).toBeInTheDocument()
  })

  it('toggling sends the opposite value, disables only that switch and refreshes', async () => {
    const pending = deferred()
    vi.mocked(api.setEpisodesMonitored).mockReturnValue(pending.promise)
    await renderOpenSeasonOne()
    const fetchesBefore = vi.mocked(api.fetchSeriesDetail).mock.calls.length

    fireEvent.click(screen.getByRole('switch', { name: 'Monitorar S01E03' }))
    await waitFor(() => expect(api.setEpisodesMonitored).toHaveBeenCalledWith([11], true))
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Monitorar S01E03' })).toBeDisabled())
    expect(screen.getByRole('switch', { name: 'Monitorar S01E04' })).toBeEnabled()

    pending.resolve()
    expect(await screen.findByRole('status')).toHaveTextContent('Monitoramento ativado')
    await waitFor(() => expect(vi.mocked(api.fetchSeriesDetail).mock.calls.length).toBeGreaterThan(fetchesBefore))

    fireEvent.click(screen.getByRole('switch', { name: 'Monitorar Temporada 2' }))
    await waitFor(() => expect(api.setSeasonMonitored).toHaveBeenCalledWith(1, 2, false))
  })

  it('a failed toggle shows the error and keeps the previous state', async () => {
    vi.mocked(api.setEpisodesMonitored).mockRejectedValue(httpError('Sonarr indisponível em http://sonarr:8989: timeout'))
    await renderOpenSeasonOne()
    fireEvent.click(screen.getByRole('switch', { name: 'Monitorar S01E03' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Sonarr indisponível em http://sonarr:8989: timeout')
    expect(screen.getByRole('switch', { name: 'Monitorar S01E03' })).toHaveAttribute('aria-checked', 'false')
  })

  it('shows search buttons per episode and per season', async () => {
    await renderOpenSeasonOne()
    const row = screen.getByText('E3').closest('tr') as HTMLElement
    expect(within(row).getByRole('button', { name: 'Buscar S01E03' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buscar Temporada 1' })).toBeInTheDocument()
  })

  it('search shows a sent toast or the error', async () => {
    const pending = deferred()
    vi.mocked(api.searchEpisode).mockReturnValue(pending.promise)
    await renderOpenSeasonOne()

    fireEvent.click(screen.getByRole('button', { name: 'Buscar S01E03' }))
    await waitFor(() => expect(api.searchEpisode).toHaveBeenCalledWith(11))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Buscar S01E03' })).toBeDisabled())
    pending.resolve()
    expect(await screen.findByRole('status')).toHaveTextContent('Busca enviada')

    fireEvent.click(screen.getByRole('button', { name: 'Buscar Temporada 1' }))
    await waitFor(() => expect(api.searchSeason).toHaveBeenCalledWith(1, 1))

    vi.mocked(api.searchEpisode).mockRejectedValue(httpError('Sonarr recusou a API key (SONARR_API_KEY)'))
    fireEvent.click(screen.getByRole('button', { name: 'Buscar S01E04' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sonarr recusou a API key (SONARR_API_KEY)')
  })
})
