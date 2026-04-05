import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RSSQueryPage } from './RSSQueryPage'
import * as hooks from '../hooks/useRss'

vi.mock('../hooks/useRss')

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

describe('RSSQueryPage', () => {
  it('renders scan all checkbox', () => {
    vi.mocked(hooks.useRss).mockReturnValue({
      isLoading: false,
      isSuccess: false,
      data: undefined,
      isError: false,
    } as ReturnType<typeof hooks.useRss>)
    render(<RSSQueryPage />, { wrapper })
    expect(screen.getByLabelText(/consultar todos os itens/i)).toBeInTheDocument()
  })

  it('renders search input', () => {
    vi.mocked(hooks.useRss).mockReturnValue({
      isLoading: false,
      isSuccess: false,
      data: undefined,
      isError: false,
    } as ReturnType<typeof hooks.useRss>)
    render(<RSSQueryPage />, { wrapper })
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument()
  })

  it('renders results when data is available', () => {
    vi.mocked(hooks.useRss).mockReturnValue({
      isLoading: false,
      isSuccess: true,
      isError: false,
      data: [{ title: 'Naruto EP1' }, { title: 'Naruto EP2' }],
    } as ReturnType<typeof hooks.useRss>)
    render(<RSSQueryPage />, { wrapper })
    expect(screen.getByText('Naruto EP1')).toBeInTheDocument()
    expect(screen.getByText('Naruto EP2')).toBeInTheDocument()
  })

  it('shows item count when results available', () => {
    vi.mocked(hooks.useRss).mockReturnValue({
      isLoading: false,
      isSuccess: true,
      isError: false,
      data: [{ title: 'Naruto EP1' }],
    } as ReturnType<typeof hooks.useRss>)
    render(<RSSQueryPage />, { wrapper })
    expect(screen.getByText(/1 item/i)).toBeInTheDocument()
  })
})
