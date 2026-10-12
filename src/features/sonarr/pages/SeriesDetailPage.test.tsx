import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SeriesDetailPage } from './SeriesDetailPage'
import * as api from '../services/api'
import type { EpisodeDetail, SeasonDetail, SeriesDetail } from '../services/types'
import { formatDate } from '../../../lib/formatDate'
import { renderWithProviders } from '../../../test/renderWithProviders'
import * as configApi from '../../server-config/services/api'

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  fetchSeriesDetail: vi.fn(),
}))
vi.mock('../../server-config/services/api')

function episode(overrides: Partial<EpisodeDetail>): EpisodeDetail {
  return { id: 1, episodeNumber: 1, title: 'Ep', airDateUtc: '2002-06-03T01:00:00Z', state: 'downloaded', monitored: true, ...overrides }
}

function season(seasonNumber: number, episodes: EpisodeDetail[], counts = { episodeFileCount: 1, episodeCount: 2 }): SeasonDetail {
  return { seasonNumber, monitored: true, ...counts, episodes }
}

const seasonOne = season(1, [
  episode({ id: 11, episodeNumber: 3, title: 'The Buys', airDateUtc: '2002-06-16T01:00:00Z', state: 'missing', monitored: false }),
  episode({ id: 12, episodeNumber: 4, title: 'Old Cases', airDateUtc: null, state: 'tba' }),
], { episodeFileCount: 3, episodeCount: 13 })

const wire: SeriesDetail = {
  id: 1, title: 'The Wire', alternateTitles: [], year: 2002, status: 'ended', network: 'HBO', overview: 'Baltimore.', sizeOnDisk: 53687091200,
  episodeFileCount: 60, episodeCount: 60,
  seasons: [
    season(2, [
      episode({ id: 21, episodeNumber: 1, title: 'Ebb Tide', state: 'downloaded' }),
      episode({ id: 22, episodeNumber: 2, title: 'Collateral', state: 'unaired' }),
    ], { episodeFileCount: 12, episodeCount: 12 }),
    seasonOne,
    season(0, [], { episodeFileCount: 0, episodeCount: 0 }),
  ],
}

const httpError = (status: number, error: string) => ({ isAxiosError: true, response: { status, data: { error } }, message: 'x' })
const seasonButton = (name: RegExp) => screen.getByRole('button', { name })
const renderDetail = () => renderWithProviders(<SeriesDetailPage />, { route: '/sonarr/1', path: '/sonarr/:seriesId' })
const cellsOfRow = (rowText: string) => within(screen.getByText(rowText).closest('tr') as HTMLElement).getAllByRole('cell').map((td) => td.textContent)

beforeEach(() => {
  vi.mocked(api.fetchSeriesDetail).mockReset()
})

describe('SeriesDetailPage', () => {
  it('shows the series header', async () => {
    vi.mocked(api.fetchSeriesDetail).mockResolvedValue(wire)
    renderDetail()

    expect(await screen.findByRole('heading', { level: 1, name: 'The Wire' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Pôster de The Wire' })).toHaveAttribute('src', '/api/sonarr/series/1/poster')
    for (const text of ['2002', 'HBO', 'Encerrada', 'Baltimore.', '50.0 GB', '60/60 episódios']) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
    expect(api.fetchSeriesDetail).toHaveBeenCalledWith(1)
  })

  it('renders seasons in order with only the first open', async () => {
    vi.mocked(api.fetchSeriesDetail).mockResolvedValue(wire)
    renderDetail()
    await screen.findByRole('heading', { level: 1 })

    const buttons = screen.getAllByRole('button', { expanded: undefined }).filter((b) => b.hasAttribute('aria-expanded'))
    expect(buttons.map((b) => b.textContent)).toEqual(['Temporada 212/12', 'Temporada 13/13', 'Especiais0/0'])
    expect(buttons.map((b) => b.getAttribute('aria-expanded'))).toEqual(['true', 'false', 'false'])
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.getByText('Ebb Tide')).toBeInTheDocument()
    expect(screen.queryByText('The Buys')).not.toBeInTheDocument()
  })

  it('toggles a season open and closed', async () => {
    vi.mocked(api.fetchSeriesDetail).mockResolvedValue(wire)
    renderDetail()
    await screen.findByRole('heading', { level: 1 })

    fireEvent.click(seasonButton(/^Temporada 1/))
    expect(screen.getByText('The Buys')).toBeInTheDocument()
    fireEvent.click(seasonButton(/^Temporada 1/))
    expect(screen.queryByText('The Buys')).not.toBeInTheDocument()
    fireEvent.click(seasonButton(/^Temporada 2/))
    expect(screen.queryByText('Ebb Tide')).not.toBeInTheDocument()
    expect(seasonButton(/^Temporada 2/)).toHaveAttribute('aria-expanded', 'false')
  })

  it('lists episodes with code, title and air date', async () => {
    vi.mocked(api.fetchSeriesDetail).mockResolvedValue(wire)
    renderDetail()
    await screen.findByRole('heading', { level: 1 })
    fireEvent.click(seasonButton(/^Temporada 1/))

    const table = screen.getByText('The Buys').closest('table') as HTMLElement
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Episódio', 'Título', 'Exibição', 'Situação', 'Monitorado', 'Ações'])
    const buys = cellsOfRow('The Buys')
    expect(buys.slice(0, 3)).toEqual(['S01E03', 'The Buys', formatDate('2002-06-16T01:00:00Z')])
    expect(buys[2]).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(cellsOfRow('Old Cases')[2]).toBe('—')
  })

  it('labels every episode state', async () => {
    vi.mocked(api.fetchSeriesDetail).mockResolvedValue(wire)
    renderDetail()
    await screen.findByRole('heading', { level: 1 })
    fireEvent.click(seasonButton(/^Temporada 1/))

    expect(cellsOfRow('Ebb Tide')[3]).toBe('Baixado')
    expect(cellsOfRow('Collateral')[3]).toBe('Não exibido')
    expect(cellsOfRow('The Buys')[3]).toBe('Faltando')
    expect(cellsOfRow('Old Cases')[3]).toBe('Sem data')
  })

  // PR 3a (sonarr-actions AC 5) replaced the read-only text of PR 2's AC 30 with a switch.
  it('shows monitored as the switch state of each row', async () => {
    vi.mocked(api.fetchSeriesDetail).mockResolvedValue(wire)
    renderDetail()
    await screen.findByRole('heading', { level: 1 })
    fireEvent.click(seasonButton(/^Temporada 1/))

    const row = (title: string) => screen.getByText(title).closest('tr') as HTMLElement
    expect(within(row('The Buys')).getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    expect(within(row('Old Cases')).getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('shows not found with a link back', async () => {
    vi.mocked(api.fetchSeriesDetail).mockRejectedValue(httpError(404, 'série 1 não encontrada no Sonarr'))
    renderDetail()

    expect(await screen.findByText('Série não encontrada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para Séries' })).toHaveAttribute('href', '/sonarr')
  })

  it('shows spinner while loading and the server error on 502', async () => {
    vi.mocked(api.fetchSeriesDetail).mockReturnValue(new Promise(() => {}))
    const loading = renderDetail()
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
    loading.unmount()

    vi.mocked(api.fetchSeriesDetail).mockRejectedValue(httpError(502, 'Sonarr indisponível em http://sonarr:8989: timeout'))
    renderDetail()
    expect(await screen.findByText('Sonarr indisponível em http://sonarr:8989: timeout')).toBeInTheDocument()
  })

  it('keeps the detail poster at a fixed thumbnail width', async () => {
    vi.mocked(api.fetchSeriesDetail).mockResolvedValue(wire)
    renderDetail()
    const poster = await screen.findByRole('img', { name: 'Pôster de The Wire' })
    expect(poster).toHaveClass('w-32')
    expect(poster).not.toHaveClass('w-full')
  })

  it('shows the upload shortcut only when upload is on', async () => {
    vi.mocked(api.fetchSeriesDetail).mockResolvedValue(wire)
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: true, sonarrUpload: true })
    const on = renderDetail()
    expect(await screen.findByRole('link', { name: 'Enviar arquivos' })).toHaveAttribute('href', '/sonarr/importar?serie=1')
    on.unmount()

    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: true, sonarrUpload: false })
    renderDetail()
    await screen.findByRole('heading', { level: 1, name: 'The Wire' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByRole('link', { name: 'Enviar arquivos' })).not.toBeInTheDocument()
  })
})

describe('SeriesDetailPage alternate titles', () => {
  const withTitles = (alternateTitles: SeriesDetail['alternateTitles']) => vi.mocked(api.fetchSeriesDetail).mockResolvedValue({ ...wire, alternateTitles })
  const names = (count: number) => Array.from({ length: count }, (_, index) => ({ title: `Nome ${index + 1}`, seasonNumbers: [] }))

  it('shows alternate titles under the title', async () => {
    withTitles([{ title: 'Shingeki no Kyojin', seasonNumbers: [1, 2, 3] }, { title: 'Attack on Titan', seasonNumbers: [] }])
    renderDetail()
    const heading = await screen.findByRole('heading', { level: 1, name: 'The Wire' })
    const line = screen.getByText(/Também conhecida como:/)
    expect(line).toHaveTextContent('Também conhecida como: Shingeki no Kyojin (T1–T3) · Attack on Titan')
    expect(heading.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('hides the alternate titles line when empty', async () => {
    withTitles([])
    renderDetail()
    await screen.findByRole('heading', { level: 1, name: 'The Wire' })
    expect(screen.queryByText(/Também conhecida como/)).not.toBeInTheDocument()
  })

  it('shows five alternate titles and expands the rest', async () => {
    withTitles(names(7))
    const seven = renderDetail()
    const line = await screen.findByText(/Também conhecida como:/)
    expect(line).toHaveTextContent('Também conhecida como: Nome 1 · Nome 2 · Nome 3 · Nome 4 · Nome 5')
    expect(line).not.toHaveTextContent('Nome 6')
    fireEvent.click(screen.getByRole('button', { name: '+2' }))
    expect(screen.getByText(/Também conhecida como:/)).toHaveTextContent('Nome 1 · Nome 2 · Nome 3 · Nome 4 · Nome 5 · Nome 6 · Nome 7')
    expect(screen.queryByRole('button', { name: '+2' })).not.toBeInTheDocument()
    seven.unmount()

    withTitles(names(5))
    renderDetail()
    await screen.findByText(/Também conhecida como:/)
    expect(screen.queryByRole('button', { name: /^\+/ })).not.toBeInTheDocument()
  })
})
