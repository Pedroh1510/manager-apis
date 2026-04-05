import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MangasListPage } from './MangasPage'
import * as mangasHook from '../hooks/useMangas'
import * as pluginsHook from '../hooks/usePlugins'

vi.mock('../hooks/useMangas')
vi.mock('../hooks/usePlugins')
vi.mock('../services/api')

const mockDeleteMutation = { mutate: vi.fn(), isPending: false }
const mockAddMutation = { mutate: vi.fn(), isPending: false, isSuccess: false }

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.mocked(pluginsHook.usePlugins).mockReturnValue({
    data: [{ id: 'tcb', name: 'TCB Scans' }],
    isLoading: false,
    isSuccess: true,
    isError: false,
  } as ReturnType<typeof pluginsHook.usePlugins>)

  vi.mocked(mangasHook.useMangas).mockReturnValue({
    mangas: {
      data: [
        { title: 'Naruto', titleInPlugin: 'Naruto', idPlugin: 'tcb' },
        { title: 'One Piece', titleInPlugin: 'One Piece', idPlugin: 'tcb' },
      ],
      isLoading: false,
      isSuccess: true,
      isError: false,
    } as any,
    deleteManga: mockDeleteMutation as any,
    addManga: mockAddMutation as any,
  })
})

describe('MangasListPage', () => {
  it('renders manga list', () => {
    render(<MangasListPage />, { wrapper })
    expect(screen.getByText('Naruto')).toBeInTheDocument()
    expect(screen.getByText('One Piece')).toBeInTheDocument()
  })

  it('filters mangas by title', () => {
    render(<MangasListPage />, { wrapper })
    fireEvent.change(screen.getByPlaceholderText(/filtrar por título/i), {
      target: { value: 'Naruto' },
    })
    expect(screen.getByText('Naruto')).toBeInTheDocument()
    expect(screen.queryByText('One Piece')).not.toBeInTheDocument()
  })

  it('filters mangas by plugin', () => {
    vi.mocked(mangasHook.useMangas).mockReturnValue({
      mangas: {
        data: [
          { title: 'Naruto', titleInPlugin: 'Naruto', idPlugin: 'tcb' },
          { title: 'Bleach', titleInPlugin: 'Bleach', idPlugin: 'other' },
        ],
        isLoading: false, isSuccess: true, isError: false,
      } as any,
      deleteManga: mockDeleteMutation as any,
      addManga: mockAddMutation as any,
    })
    render(<MangasListPage />, { wrapper })
    fireEvent.change(screen.getByLabelText(/filtrar por plugin/i), {
      target: { value: 'tcb' },
    })
    expect(screen.getByText('Naruto')).toBeInTheDocument()
    expect(screen.queryByText('Bleach')).not.toBeInTheDocument()
  })

  it('opens confirm dialog when clicking delete', () => {
    render(<MangasListPage />, { wrapper })
    fireEvent.click(screen.getAllByRole('button', { name: /deletar/i })[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders Add Manga button', () => {
    render(<MangasListPage />, { wrapper })
    expect(screen.getByRole('button', { name: /adicionar manga/i })).toBeInTheDocument()
  })
})
