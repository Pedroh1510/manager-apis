import { cleanup, render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routes } from './router'
import { ToastProvider } from './components/ui/Toast'
import { createTestQueryClient } from './test/renderWithProviders'
import * as mangasApi from './features/mangas/services/api'
import * as queuesApi from './features/queues/services/api'
import * as configApi from './features/server-config/services/api'
import * as torrentsApi from './features/torrents/services/api'
import * as sonarrApi from './features/sonarr/services/api'

vi.mock('./features/mangas/services/api')
vi.mock('./features/queues/services/api')
vi.mock('./features/server-config/services/api')
vi.mock('./features/torrents/services/api')
vi.mock('./features/sonarr/services/api')

function renderAt(path: string) {
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>
        <RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />
      </ToastProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(mangasApi.fetchPlugins).mockResolvedValue([])
  vi.mocked(mangasApi.fetchMangaList).mockResolvedValue([
    { idManga: 1, title: 'Naruto', createdAt: '', updatedAt: '', connectors: [] },
  ])
  vi.mocked(mangasApi.fetchChapters).mockResolvedValue([])
  vi.mocked(queuesApi.fetchMangasQueuesSummary).mockResolvedValue([])
  vi.mocked(queuesApi.fetchRssQueuesSummary).mockResolvedValue([])
  vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: true, sonarr: true })
  vi.mocked(sonarrApi.fetchSeriesList).mockResolvedValue([])
  vi.mocked(sonarrApi.fetchSeriesDetail).mockResolvedValue({
    id: 1, title: 'The Wire', year: 2002, status: 'ended', network: 'HBO', overview: '', sizeOnDisk: 0, episodeFileCount: 0, episodeCount: 0, seasons: [],
  })
  vi.mocked(torrentsApi.fetchTorrents).mockResolvedValue({
    counts: { downloading: 0, completed: 0, queued: 0, stopped: 0 }, overallEtaSeconds: null, etaUnknownCount: 0, active: [],
  })
})

describe('router', () => {
  it('resolves fixed routes before the manga detail route', async () => {
    renderAt('/mangas/list')
    expect(await screen.findByRole('heading', { name: 'Mangás' })).toBeInTheDocument()
  })

  it('resolves fixed routes before the manga detail route (admin)', async () => {
    renderAt('/mangas/admin')
    expect(await screen.findByRole('heading', { name: 'Configurações', level: 1 })).toBeInTheDocument()
    expect(screen.queryByText('Mangá não encontrado')).not.toBeInTheDocument()
  })

  it('resolves fixed routes before the manga detail route (detail)', async () => {
    renderAt('/mangas/1')
    expect(await screen.findByRole('heading', { name: 'Naruto' })).toBeInTheDocument()
  })

  it('resolves fixed routes before the manga detail route (queues)', async () => {
    renderAt('/filas')
    expect(await screen.findByRole('heading', { name: 'Filas', level: 1 })).toBeInTheDocument()
  })

  it('renders the torrents page at /torrents', async () => {
    renderAt('/torrents')
    expect(await screen.findByRole('heading', { name: 'Torrents', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders the sonarr library and detail routes', async () => {
    renderAt('/sonarr')
    expect(await screen.findByRole('heading', { name: 'Séries', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    cleanup()

    renderAt('/sonarr/1')
    expect(await screen.findByRole('heading', { name: 'The Wire', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
