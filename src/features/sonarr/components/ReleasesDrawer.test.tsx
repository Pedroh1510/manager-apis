import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SeriesDetailPage } from '../pages/SeriesDetailPage'
import * as api from '../services/api'
import type { ReleaseSummary, SeriesDetail } from '../services/types'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  fetchSeriesDetail: vi.fn(),
  fetchReleases: vi.fn(),
  grabRelease: vi.fn(),
}))

const wire: SeriesDetail = {
  id: 1, title: 'The Wire', year: 2002, status: 'ended', network: 'HBO', overview: '', sizeOnDisk: 0, episodeFileCount: 0, episodeCount: 1,
  seasons: [{
    seasonNumber: 1, monitored: true, episodeFileCount: 0, episodeCount: 1,
    episodes: [{ id: 11, episodeNumber: 3, title: 'The Buys', airDateUtc: null, state: 'missing', monitored: true }],
  }],
}

const approved: ReleaseSummary = {
  guid: 'g1', indexerId: 3, title: 'Show.S01E03.1080p', indexer: 'Nyaa', quality: 'WEBDL-1080p', size: 1610612736,
  seeders: 12, leechers: 3, ageHours: 30.5, approved: true, rejections: [],
}
const rejected: ReleaseSummary = {
  guid: 'g2', indexerId: 4, title: 'Show.S01E03.480p', indexer: 'Usenet', quality: 'SDTV', size: 524288000,
  seeders: null, leechers: null, ageHours: 100, approved: false, rejections: ['Quality not wanted'],
}

const httpError = (error: string) => ({ isAxiosError: true, response: { status: 502, data: { error } }, message: 'x' })
const drawer = () => screen.getByRole('dialog')
const row = (guid: string) => screen.getByTestId(`release-${guid}`)

async function openEpisodeSearch() {
  renderWithProviders(<SeriesDetailPage />, { route: '/sonarr/1', path: '/sonarr/:seriesId' })
  fireEvent.click(await screen.findByRole('button', { name: 'Busca interativa S01E03' }))
}

beforeEach(() => {
  vi.mocked(api.fetchSeriesDetail).mockReset().mockResolvedValue(wire)
  vi.mocked(api.fetchReleases).mockReset().mockResolvedValue([approved, rejected])
  vi.mocked(api.grabRelease).mockReset().mockResolvedValue()
})

describe('ReleasesDrawer', () => {
  it('opens from episode and season with the right query and title', async () => {
    await openEpisodeSearch()
    expect(within(drawer()).getByRole('heading', { name: 'Releases — S01E03' })).toBeInTheDocument()
    await waitFor(() => expect(api.fetchReleases).toHaveBeenCalledWith({ episodeId: 11 }))

    fireEvent.click(within(drawer()).getByRole('button', { name: 'Fechar painel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Busca interativa Temporada 1' }))
    expect(within(drawer()).getByRole('heading', { name: 'Releases — Temporada 1' })).toBeInTheDocument()
    await waitFor(() => expect(api.fetchReleases).toHaveBeenCalledWith({ seriesId: 1, seasonNumber: 1 }))
  })

  it('shows loading, empty and error states', async () => {
    vi.mocked(api.fetchReleases).mockReturnValue(new Promise(() => {}))
    const loading = renderWithProviders(<SeriesDetailPage />, { route: '/sonarr/1', path: '/sonarr/:seriesId' })
    fireEvent.click(await screen.findByRole('button', { name: 'Busca interativa S01E03' }))
    expect(within(drawer()).getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
    expect(within(drawer()).getByText('Consultando indexers…')).toBeInTheDocument()
    loading.unmount()

    vi.mocked(api.fetchReleases).mockResolvedValue([])
    const empty = renderWithProviders(<SeriesDetailPage />, { route: '/sonarr/1', path: '/sonarr/:seriesId' })
    fireEvent.click(await screen.findByRole('button', { name: 'Busca interativa S01E03' }))
    expect(await within(drawer()).findByText('Nenhum release encontrado')).toBeInTheDocument()
    empty.unmount()

    vi.mocked(api.fetchReleases).mockRejectedValue(httpError('Sonarr indisponível em http://sonarr:8989: timeout'))
    await openEpisodeSearch()
    expect(await within(drawer()).findByText('Sonarr indisponível em http://sonarr:8989: timeout')).toBeInTheDocument()
  })

  it('lists each release with its details', async () => {
    await openEpisodeSearch()
    const first = await screen.findByTestId('release-g1')
    for (const text of ['Show.S01E03.1080p', 'Nyaa', 'WEBDL-1080p', '1.5 GB', '12/3', '30h']) {
      expect(within(first).getByText(text)).toBeInTheDocument()
    }
    expect(within(first).getByRole('button', { name: 'Baixar' })).toBeEnabled()
    expect(within(row('g2')).getByText('—')).toBeInTheDocument()
  })

  it('dims rejected releases and shows the reasons', async () => {
    await openEpisodeSearch()
    await screen.findByTestId('release-g1')
    expect(row('g2')).toHaveClass('opacity-60')
    expect(within(row('g2')).getByText('Quality not wanted')).toBeInTheDocument()
    expect(row('g1')).not.toHaveClass('opacity-60')
  })

  it('grabs an approved release without confirmation', async () => {
    await openEpisodeSearch()
    fireEvent.click(within(await screen.findByTestId('release-g1')).getByRole('button', { name: 'Baixar' }))
    await waitFor(() => expect(api.grabRelease).toHaveBeenCalledWith({ guid: 'g1', indexerId: 3 }))
    expect(screen.queryByText('Baixar mesmo assim?')).not.toBeInTheDocument()
  })

  it('asks before grabbing a rejected release', async () => {
    await openEpisodeSearch()
    await screen.findByTestId('release-g2')
    fireEvent.click(within(row('g2')).getByRole('button', { name: 'Baixar' }))
    const confirm = screen.getByRole('dialog', { name: 'Baixar mesmo assim?' })
    expect(within(confirm).getByText('Quality not wanted')).toBeInTheDocument()
    fireEvent.click(within(confirm).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Baixar mesmo assim?' })).not.toBeInTheDocument()
    expect(api.grabRelease).not.toHaveBeenCalled()

    fireEvent.click(within(row('g2')).getByRole('button', { name: 'Baixar' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Baixar mesmo assim?' })).getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(api.grabRelease).toHaveBeenCalledWith({ guid: 'g2', indexerId: 4 }))
  })

  it('marks a sent release or shows the error', async () => {
    await openEpisodeSearch()
    fireEvent.click(within(await screen.findByTestId('release-g1')).getByRole('button', { name: 'Baixar' }))
    expect(await within(row('g1')).findByRole('button', { name: 'Enviado' })).toBeDisabled()
    expect(await screen.findByRole('status')).toHaveTextContent('Enviado para download')

    vi.mocked(api.grabRelease).mockRejectedValue(httpError('Sonarr indisponível em http://sonarr:8989: timeout'))
    fireEvent.click(within(row('g2')).getByRole('button', { name: 'Baixar' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Baixar mesmo assim?' })).getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sonarr indisponível em http://sonarr:8989: timeout')
    expect(within(row('g2')).getByRole('button', { name: 'Baixar' })).toBeEnabled()
  })

  it('sorts releases by newest without a new search', async () => {
    const older = { ...approved, guid: 'g3', title: 'Show.S01E03.720p', ageHours: 200 }
    vi.mocked(api.fetchReleases).mockResolvedValue([approved, older, rejected])
    await openEpisodeSearch()
    await screen.findByTestId('release-g1')
    const order = () => within(drawer()).getAllByTestId(/^release-/).map((item) => item.dataset.testid)

    const select = within(drawer()).getByRole('combobox', { name: 'Ordenar por' })
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['Sonarr', 'Mais recentes'])
    expect(select).toHaveValue('sonarr')
    expect(order()).toEqual(['release-g1', 'release-g3', 'release-g2'])

    fireEvent.change(select, { target: { value: 'newest' } })
    expect(order()).toEqual(['release-g1', 'release-g2', 'release-g3'])
    expect(api.fetchReleases).toHaveBeenCalledTimes(1)
  })
})
