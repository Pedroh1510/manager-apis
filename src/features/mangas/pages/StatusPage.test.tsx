import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MangasStatusPage } from './StatusPage'
import * as hooks from '../hooks/useMangasStatus'

vi.mock('../hooks/useMangasStatus')

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

describe('MangasStatusPage', () => {
  it('shows loading badge when loading', () => {
    vi.mocked(hooks.useMangasStatus).mockReturnValue({
      isLoading: true, isSuccess: false, isError: false, data: undefined, error: null,
    } as ReturnType<typeof hooks.useMangasStatus>)
    render(<MangasStatusPage />, { wrapper })
    expect(screen.getByText('Verificando...')).toBeInTheDocument()
  })

  it('shows online badge when service responds', () => {
    vi.mocked(hooks.useMangasStatus).mockReturnValue({
      isLoading: false, isSuccess: true, isError: false,
      data: { version: '16.2', maxConnections: 100, openedConnections: 3 }, error: null,
    } as ReturnType<typeof hooks.useMangasStatus>)
    render(<MangasStatusPage />, { wrapper })
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('shows offline badge when service errors', () => {
    vi.mocked(hooks.useMangasStatus).mockReturnValue({
      isLoading: false, isSuccess: false, isError: true, data: undefined, error: new Error('fail'),
    } as ReturnType<typeof hooks.useMangasStatus>)
    render(<MangasStatusPage />, { wrapper })
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })
})
