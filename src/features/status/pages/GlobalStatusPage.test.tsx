import { screen, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GlobalStatusPage } from './GlobalStatusPage'
import * as animeHooks from '../../../features/anime-rss/hooks/useAnimeStatus'
import * as mangasHooks from '../../../features/mangas/hooks/useMangasStatus'
import * as queuesApi from '../../queues/services/api'
import * as statusApi from '../services/api'
import * as configApi from '../../server-config/services/api'
import * as torrentsApi from '../../torrents/services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { queue } from '../../queues/test/fixtures'

vi.mock('../../../features/anime-rss/hooks/useAnimeStatus')
vi.mock('../../../features/mangas/hooks/useMangasStatus')
vi.mock('../../queues/services/api')
vi.mock('../services/api')
vi.mock('../../server-config/services/api')
vi.mock('../../torrents/services/api')

const loading = { isLoading: true, isSuccess: false, isError: false, data: undefined, error: null }
const online = { isLoading: false, isSuccess: true, isError: false, data: undefined, error: null }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(animeHooks.useAnimeStatus).mockReturnValue(loading as ReturnType<typeof animeHooks.useAnimeStatus>)
  vi.mocked(mangasHooks.useMangasStatus).mockReturnValue(loading as ReturnType<typeof mangasHooks.useMangasStatus>)
  vi.mocked(queuesApi.fetchMangasQueuesSummary).mockResolvedValue([queue('download')])
  vi.mocked(queuesApi.fetchRssQueuesSummary).mockResolvedValue([queue('Scan process')])
  vi.mocked(statusApi.fetchPendingMigrations).mockResolvedValue([])
  vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false })
})

const section = (name: string) => screen.getByRole('heading', { name, level: 2 }).closest('section') as HTMLElement

describe('GlobalStatusPage', () => {
  it('renders page title and both section headings', () => {
    renderWithProviders(<GlobalStatusPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Anime RSS' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mangas Manager' })).toBeInTheDocument()
  })

  it('a failing migrations query does not break the page', async () => {
    vi.mocked(statusApi.fetchPendingMigrations).mockRejectedValue({ isAxiosError: true, response: { data: 'Something broke!' }, message: 'x' })
    renderWithProviders(<GlobalStatusPage />)

    expect(await within(section('Mangas Manager')).findByText(/Something broke!/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Anime RSS' })).toBeInTheDocument()
    expect(await screen.findByTestId('queue-card-download')).toBeInTheDocument()
  })

  it('shows queues per API and isolates a failing one', async () => {
    vi.mocked(queuesApi.fetchMangasQueuesSummary).mockRejectedValue({
      isAxiosError: true,
      response: { status: 503, data: { message: 'Queue backend unavailable' } },
      message: 'x',
    })
    renderWithProviders(<GlobalStatusPage />)

    expect(await within(section('Mangas Manager')).findByText('Filas indisponíveis')).toBeInTheDocument()
    expect(await within(section('Anime RSS')).findByTestId('queue-card-Scan process')).toBeInTheDocument()
    expect(within(section('Anime RSS')).queryByText('Filas indisponíveis')).not.toBeInTheDocument()
  })

  it('counts qbittorrent in the summary only when configured', async () => {
    vi.mocked(animeHooks.useAnimeStatus).mockReturnValue(online as ReturnType<typeof animeHooks.useAnimeStatus>)
    vi.mocked(mangasHooks.useMangasStatus).mockReturnValue(online as ReturnType<typeof mangasHooks.useMangasStatus>)
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: true })
    vi.mocked(torrentsApi.fetchQbittorrentStatus).mockRejectedValue({
      isAxiosError: true, response: { status: 502, data: { error: 'qBittorrent indisponível em http://qbit:8080: timeout' } }, message: 'x',
    })
    const configured = renderWithProviders(<GlobalStatusPage />)
    expect(await screen.findByText('1 sistema(s) com problema')).toBeInTheDocument()
    configured.unmount()

    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false })
    renderWithProviders(<GlobalStatusPage />)
    expect(await within(section('qBittorrent')).findByText('Não configurado')).toBeInTheDocument()
    expect(screen.getByText('Todos os sistemas operacionais')).toBeInTheDocument()
  })
})
