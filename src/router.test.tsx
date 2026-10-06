import { render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routes } from './router'
import { ToastProvider } from './components/ui/Toast'
import { createTestQueryClient } from './test/renderWithProviders'
import * as mangasApi from './features/mangas/services/api'
import * as queuesApi from './features/queues/services/api'

vi.mock('./features/mangas/services/api')
vi.mock('./features/queues/services/api')

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
})

describe('router', () => {
  it('resolves fixed routes before the manga detail route', async () => {
    renderAt('/mangas/list')
    expect(await screen.findByRole('heading', { name: 'Mangás' })).toBeInTheDocument()
  })

  it('resolves fixed routes before the manga detail route (admin)', async () => {
    renderAt('/mangas/admin')
    expect(screen.queryByText('Mangá não encontrado')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Naruto' })).not.toBeInTheDocument()
  })

  it('resolves fixed routes before the manga detail route (detail)', async () => {
    renderAt('/mangas/1')
    expect(await screen.findByRole('heading', { name: 'Naruto' })).toBeInTheDocument()
  })

  it('resolves fixed routes before the manga detail route (queues)', async () => {
    renderAt('/filas')
    expect(await screen.findByRole('heading', { name: 'Filas', level: 1 })).toBeInTheDocument()
  })
})
