import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimeRssAdminPage } from './AdminPage'
import * as hooks from '../hooks/useTorrents'

vi.mock('../hooks/useTorrents')

const mockMutation = { mutate: vi.fn(), isPending: false }

function mockTorrents(torrents: ReturnType<typeof hooks.useTorrents>['torrents']['data']) {
  vi.mocked(hooks.useTorrents).mockReturnValue({
    torrents: { data: torrents, isLoading: false, isSuccess: true, isError: false } as any,
    concludedTorrents: { data: [], isLoading: false } as any,
    stopTorrent: mockMutation as any,
    deleteTorrent: mockMutation as any,
    deleteAll: mockMutation as any,
  })
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

describe('AnimeRssAdminPage', () => {
  it('renders active torrents table', () => {
    mockTorrents([
      { hash: 'abc', name: 'Naruto EP1', state: 'downloading', progress: 0.5, size: 1024, dlspeed: 100 },
    ])
    render(<AnimeRssAdminPage />, { wrapper })
    expect(screen.getByText('Naruto EP1')).toBeInTheDocument()
  })

  it('shows delete all torrents button', () => {
    mockTorrents([])
    render(<AnimeRssAdminPage />, { wrapper })
    expect(screen.getByRole('button', { name: /deletar todos/i })).toBeInTheDocument()
  })

  it('opens confirm dialog when deleting a torrent', () => {
    mockTorrents([
      { hash: 'abc', name: 'Naruto EP1', state: 'downloading', progress: 0.5, size: 1024, dlspeed: 100 },
    ])
    render(<AnimeRssAdminPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /deletar naruto ep1/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
