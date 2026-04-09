import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GlobalStatusPage } from './GlobalStatusPage'
import * as animeHooks from '../../../features/anime-rss/hooks/useAnimeStatus'
import * as mangasHooks from '../../../features/mangas/hooks/useMangasStatus'

vi.mock('../../../features/anime-rss/hooks/useAnimeStatus')
vi.mock('../../../features/mangas/hooks/useMangasStatus')

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

describe('GlobalStatusPage', () => {
  it('renders page title and both section headings', () => {
    vi.mocked(animeHooks.useAnimeStatus).mockReturnValue({
      isLoading: true, isSuccess: false, isError: false, data: undefined, error: null,
    } as ReturnType<typeof animeHooks.useAnimeStatus>)
    vi.mocked(mangasHooks.useMangasStatus).mockReturnValue({
      isLoading: true, isSuccess: false, isError: false, data: undefined, error: null,
    } as ReturnType<typeof mangasHooks.useMangasStatus>)

    render(<GlobalStatusPage />, { wrapper })

    expect(screen.getByRole('heading', { level: 1, name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Anime RSS' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mangas Manager' })).toBeInTheDocument()
  })
})
