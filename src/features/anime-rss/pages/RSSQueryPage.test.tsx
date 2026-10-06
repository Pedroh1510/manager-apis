import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RSSQueryPage } from './RSSQueryPage'
import { ToastProvider } from '../../../components/ui/Toast'
import * as hooks from '../hooks/useRss'

vi.mock('../hooks/useRss')

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  )
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

  it('keeps the rss search', () => {
    vi.mocked(hooks.useRss).mockReturnValue({
      data: [], isLoading: false, isError: false, error: null,
    } as unknown as ReturnType<typeof hooks.useRss>)
    render(<RSSQueryPage />, { wrapper })

    fireEvent.change(screen.getByPlaceholderText(/buscar por título/i), { target: { value: 'frieren' } })
    fireEvent.click(screen.getByRole('checkbox'))

    expect(hooks.useRss).toHaveBeenLastCalledWith({ scanAllItems: true, q: 'frieren' })
  })

  it('opens the add item drawer', () => {
    vi.mocked(hooks.useRss).mockReturnValue({
      data: [], isLoading: false, isError: false, error: null,
    } as unknown as ReturnType<typeof hooks.useRss>)
    render(<RSSQueryPage />, { wrapper })

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }))

    expect(screen.getByRole('dialog', { name: 'Adicionar item ao feed' })).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toBeInTheDocument()
    expect(screen.getByLabelText('Magnet')).toBeInTheDocument()
  })
})
