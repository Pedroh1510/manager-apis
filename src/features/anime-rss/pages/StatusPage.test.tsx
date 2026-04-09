import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimeRssStatusPage } from './StatusPage'
import * as hooks from '../hooks/useAnimeStatus'

vi.mock('../hooks/useAnimeStatus')

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

describe('AnimeRssStatusPage', () => {
  it('shows loading badge when loading', () => {
    vi.mocked(hooks.useAnimeStatus).mockReturnValue({
      isLoading: true,
      isSuccess: false,
      isError: false,
      data: undefined,
      error: null,
    } as ReturnType<typeof hooks.useAnimeStatus>)
    render(<AnimeRssStatusPage />, { wrapper })
    expect(screen.getByText('Verificando...')).toBeInTheDocument()
  })

  it('shows online badge when service responds', () => {
    vi.mocked(hooks.useAnimeStatus).mockReturnValue({
      isLoading: false,
      isSuccess: true,
      isError: false,
      data: {
        database: { version: '16.2', maxConnections: 100, activeConnections: 3 },
        qbittorrent: { version: 'v5.1.4', apiVersion: '2.11.4' },
      },
      error: null,
    } as ReturnType<typeof hooks.useAnimeStatus>)
    render(<AnimeRssStatusPage />, { wrapper })
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('shows offline badge when service errors', () => {
    vi.mocked(hooks.useAnimeStatus).mockReturnValue({
      isLoading: false,
      isSuccess: false,
      isError: true,
      data: undefined,
      error: new Error('Network error'),
    } as ReturnType<typeof hooks.useAnimeStatus>)
    render(<AnimeRssStatusPage />, { wrapper })
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })
})
