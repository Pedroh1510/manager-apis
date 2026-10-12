import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TorrentsPage } from './TorrentsPage'
import * as api from '../services/api'
import type { TorrentsSummary } from '../services/types'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api')

function summary(overrides: Partial<TorrentsSummary> = {}): TorrentsSummary {
  return {
    counts: { downloading: 3, completed: 12, queued: 1, stopped: 2 },
    overallEtaSeconds: 5400,
    etaUnknownCount: 0,
    active: [],
    ...overrides,
  }
}

const httpError = (status: number, error: string) => ({ isAxiosError: true, response: { status, data: { error } }, message: 'x' })
const card = (label: string) => screen.getByText(label).closest('[data-testid="torrent-card"]') as HTMLElement

beforeEach(() => vi.resetAllMocks())

describe('TorrentsPage', () => {
  it('shows the count cards and overall eta', async () => {
    vi.mocked(api.fetchTorrents).mockResolvedValue(summary())
    renderWithProviders(<TorrentsPage />)

    await screen.findByText('Baixando')
    expect(within(card('Baixando')).getByText('3')).toBeInTheDocument()
    expect(within(card('Concluídos')).getByText('12')).toBeInTheDocument()
    expect(within(card('Na fila')).getByText('1')).toBeInTheDocument()
    expect(within(card('Parados')).getByText('2')).toBeInTheDocument()
    expect(within(card('ETA geral')).getByText('1h 30min')).toBeInTheDocument()
  })

  it('shows how many torrents have no estimate', async () => {
    vi.mocked(api.fetchTorrents).mockResolvedValue(summary({ etaUnknownCount: 2 }))
    renderWithProviders(<TorrentsPage />)
    expect(await screen.findByText('+2 sem estimativa')).toBeInTheDocument()
  })

  it('hides the no-estimate note when every torrent has an eta', async () => {
    vi.mocked(api.fetchTorrents).mockResolvedValue(summary({ etaUnknownCount: 0 }))
    renderWithProviders(<TorrentsPage />)
    await screen.findByText('Baixando')
    expect(screen.queryByText(/sem estimativa/)).not.toBeInTheDocument()
  })

  it('lists active torrents in the received order', async () => {
    vi.mocked(api.fetchTorrents).mockResolvedValue(summary({
      active: [
        { hash: 'a', name: 'Show A', progress: 0.456, downloadSpeed: 2621440, etaSeconds: 125, category: '' },
        { hash: 'b', name: 'Show B', progress: 0.1, downloadSpeed: 51200, etaSeconds: null, category: 'anime' },
      ],
    }))
    renderWithProviders(<TorrentsPage />)

    const table = await screen.findByRole('table')
    const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual(['Nome', 'Progresso', 'Velocidade', 'ETA', 'Categoria'])
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual(['Show A', 'Show B'])
    expect(within(rows[0]).getAllByRole('cell').map((td) => td.textContent)).toEqual(['Show A', '46%', '2.5 MB/s', '2min', '—'])
    expect(within(rows[1]).getAllByRole('cell').map((td) => td.textContent)).toEqual(['Show B', '10%', '50 KB/s', '—', 'anime'])
  })

  it('shows the empty state without a table', async () => {
    vi.mocked(api.fetchTorrents).mockResolvedValue(summary({ active: [] }))
    renderWithProviders(<TorrentsPage />)
    expect(await screen.findByText('Nenhum torrent baixando')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows the spinner on first load', () => {
    vi.mocked(api.fetchTorrents).mockReturnValue(new Promise(() => {}))
    renderWithProviders(<TorrentsPage />)
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
    expect(screen.queryByText('Baixando')).not.toBeInTheDocument()
  })

  it('shows the server error message on 502', async () => {
    vi.mocked(api.fetchTorrents).mockRejectedValue(httpError(502, 'qBittorrent indisponível em http://qbit:8080: timeout'))
    renderWithProviders(<TorrentsPage />)
    expect(await screen.findByText('qBittorrent indisponível em http://qbit:8080: timeout')).toBeInTheDocument()
  })

  it('shows not configured on 503', async () => {
    vi.mocked(api.fetchTorrents).mockRejectedValue(httpError(503, 'qBittorrent não configurado (QBITTORRENT_URL ausente)'))
    renderWithProviders(<TorrentsPage />)
    expect(await screen.findByText('qBittorrent não configurado')).toBeInTheDocument()
  })
})
