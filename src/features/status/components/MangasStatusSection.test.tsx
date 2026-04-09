import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MangasStatusSection } from './MangasStatusSection'
import * as hooks from '../../../features/mangas/hooks/useMangasStatus'

vi.mock('../../../features/mangas/hooks/useMangasStatus')

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

describe('MangasStatusSection', () => {
  it('shows section heading', () => {
    vi.mocked(hooks.useMangasStatus).mockReturnValue({
      isLoading: true, isSuccess: false, isError: false, data: undefined, error: null,
    } as ReturnType<typeof hooks.useMangasStatus>)
    render(<MangasStatusSection />, { wrapper })
    expect(screen.getByRole('heading', { name: 'Mangas Manager' })).toBeInTheDocument()
  })

  it('shows loading badge when loading', () => {
    vi.mocked(hooks.useMangasStatus).mockReturnValue({
      isLoading: true, isSuccess: false, isError: false, data: undefined, error: null,
    } as ReturnType<typeof hooks.useMangasStatus>)
    render(<MangasStatusSection />, { wrapper })
    expect(screen.getByText('Verificando...')).toBeInTheDocument()
  })

  it('shows online badge and db details when service responds', () => {
    vi.mocked(hooks.useMangasStatus).mockReturnValue({
      isLoading: false, isSuccess: true, isError: false,
      data: { version: '16.2', maxConnections: 100, openedConnections: 3 },
      error: null,
    } as ReturnType<typeof hooks.useMangasStatus>)
    render(<MangasStatusSection />, { wrapper })
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('16.2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows offline badge and error message when service errors', () => {
    vi.mocked(hooks.useMangasStatus).mockReturnValue({
      isLoading: false, isSuccess: false, isError: true, data: undefined, error: new Error('fail'),
    } as ReturnType<typeof hooks.useMangasStatus>)
    render(<MangasStatusSection />, { wrapper })
    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(screen.getByText('Não foi possível conectar à API de Mangas.')).toBeInTheDocument()
  })
})
