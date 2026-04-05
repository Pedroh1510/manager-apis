import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MangasAdminPage } from './AdminPage'
import * as pluginsHook from '../hooks/usePlugins'
import * as adminHook from '../hooks/useAdminActions'

vi.mock('../hooks/usePlugins')
vi.mock('../hooks/useAdminActions')

const mockMutation = { mutate: vi.fn(), isPending: false, isSuccess: false, isError: false }

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

describe('MangasAdminPage', () => {
  beforeEach(() => {
    vi.mocked(pluginsHook.usePlugins).mockReturnValue({
      data: [{ id: 'tcb', name: 'TCB Scans' }],
      isLoading: false,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof pluginsHook.usePlugins>)

    vi.mocked(adminHook.useAdminActions).mockReturnValue({
      updateCookie: mockMutation as any,
      updateCredentials: mockMutation as any,
      updateMangasByPlugin: mockMutation as any,
    })
  })

  it('renders plugin selector', () => {
    render(<MangasAdminPage />, { wrapper })
    expect(screen.getByLabelText(/plugin/i)).toBeInTheDocument()
  })

  it('renders TCB Scans in plugin selector', () => {
    render(<MangasAdminPage />, { wrapper })
    expect(screen.getByRole('option', { name: 'TCB Scans' })).toBeInTheDocument()
  })

  it('renders update mangas button', () => {
    render(<MangasAdminPage />, { wrapper })
    expect(screen.getByRole('button', { name: /atualizar mangas/i })).toBeInTheDocument()
  })

  it('renders cookie form', () => {
    render(<MangasAdminPage />, { wrapper })
    expect(screen.getByLabelText(/cookie/i)).toBeInTheDocument()
  })

  it('renders credentials form', () => {
    render(<MangasAdminPage />, { wrapper })
    expect(screen.getByLabelText(/user.?agent/i)).toBeInTheDocument()
  })
})
