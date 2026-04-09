import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimeRssStatusSection } from './AnimeRssStatusSection'
import * as hooks from '../../../features/anime-rss/hooks/useAnimeStatus'

vi.mock('../../../features/anime-rss/hooks/useAnimeStatus')

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

describe('AnimeRssStatusSection', () => {
  it('shows section heading', () => {
    vi.mocked(hooks.useAnimeStatus).mockReturnValue({
      isLoading: true, isSuccess: false, isError: false, data: undefined, error: null,
    } as ReturnType<typeof hooks.useAnimeStatus>)
    render(<AnimeRssStatusSection />, { wrapper })
    expect(screen.getByRole('heading', { name: 'Anime RSS' })).toBeInTheDocument()
  })

  it('shows loading badge when loading', () => {
    vi.mocked(hooks.useAnimeStatus).mockReturnValue({
      isLoading: true, isSuccess: false, isError: false, data: undefined, error: null,
    } as ReturnType<typeof hooks.useAnimeStatus>)
    render(<AnimeRssStatusSection />, { wrapper })
    expect(screen.getByText('Verificando...')).toBeInTheDocument()
  })

  it('shows online badge and details when service responds', () => {
    vi.mocked(hooks.useAnimeStatus).mockReturnValue({
      isLoading: false, isSuccess: true, isError: false,
      data: {
        database: { version: '16.2', maxConnections: 100, activeConnections: 3 },
        qbittorrent: { version: 'v5.1.4', apiVersion: '2.11.4' },
      },
      error: null,
    } as ReturnType<typeof hooks.useAnimeStatus>)
    render(<AnimeRssStatusSection />, { wrapper })
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('16.2')).toBeInTheDocument()
    expect(screen.getByText('v5.1.4')).toBeInTheDocument()
  })

  it('shows offline badge and error message when service errors', () => {
    vi.mocked(hooks.useAnimeStatus).mockReturnValue({
      isLoading: false, isSuccess: false, isError: true, data: undefined, error: new Error('fail'),
    } as ReturnType<typeof hooks.useAnimeStatus>)
    render(<AnimeRssStatusSection />, { wrapper })
    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(screen.getByText('Não foi possível conectar à API de RSS.')).toBeInTheDocument()
  })
})
