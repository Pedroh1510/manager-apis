/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MangasListPage } from './MangasPage'
import * as mangasHook from '../hooks/useMangas'
import * as pluginsHook from '../hooks/usePlugins'
import * as api from '../services/api'

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
        { idManga: 1, title: 'Naruto', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { idManga: 2, title: 'One Piece', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
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

  it('opens confirm dialog when clicking delete', () => {
    render(<MangasListPage />, { wrapper })
    fireEvent.click(screen.getAllByRole('button', { name: /deletar/i })[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders Add Manga button', () => {
    render(<MangasListPage />, { wrapper })
    expect(screen.getByRole('button', { name: /adicionar manga/i })).toBeInTheDocument()
  })

  it('shows plugin filter input in select-plugin step', () => {
    render(<MangasListPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /adicionar manga/i }))
    expect(screen.getByPlaceholderText(/filtrar plugin/i)).toBeInTheDocument()
  })

  it('filters plugins in select-plugin step', () => {
    vi.mocked(pluginsHook.usePlugins).mockReturnValue({
      data: [
        { id: 'tcb', name: 'TCB Scans' },
        { id: 'other', name: 'Other Source' },
      ],
      isLoading: false,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof pluginsHook.usePlugins>)
    render(<MangasListPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /adicionar manga/i }))
    fireEvent.change(screen.getByPlaceholderText(/filtrar plugin/i), { target: { value: 'TCB' } })
    expect(screen.getByRole('option', { name: 'TCB Scans' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Other Source' })).not.toBeInTheDocument()
  })

  it('does NOT reset to list step before addManga succeeds', async () => {
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([
      { id: 'a1', title: 'Manga A' },
      { id: 'b1', title: 'Manga B' },
    ])
    render(<MangasListPage />, { wrapper })

    // navigate to select-plugin
    fireEvent.click(screen.getByRole('button', { name: /adicionar manga/i }))
    // select plugin
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'tcb' } })
    // go to next
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    // wait for select-manga step
    await waitFor(() => expect(screen.getByText('Manga A')).toBeInTheDocument())
    // select manga
    fireEvent.click(screen.getByText('Manga A'))

    // now on confirm-add step — unique label visible
    expect(screen.getByText(/título no plugin/i)).toBeInTheDocument()

    // click add
    fireEvent.click(screen.getByRole('button', { name: /^adicionar$/i }))

    // mutate was called with correct payload AND onSuccess callback
    expect(mockAddMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Manga A',
        idPlugin: 'tcb',
        idMangaPlugin: 'a1',
        titlePlugin: 'Manga A',
      }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )

    // confirm form is still visible (state has NOT reset yet)
    expect(screen.getByText(/título no plugin/i)).toBeInTheDocument()
  })

  it('resets to list step after addManga onSuccess fires', async () => {
    let capturedOnSuccess: (() => void) | undefined
    const mutateSpy = vi.fn((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      capturedOnSuccess = opts?.onSuccess
    })
    vi.mocked(mangasHook.useMangas).mockReturnValue({
      mangas: { data: [], isLoading: false, isSuccess: true, isError: false } as any,
      deleteManga: mockDeleteMutation as any,
      addManga: { mutate: mutateSpy, isPending: false, isSuccess: false } as any,
    })
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([{ id: 'a1', title: 'Manga A' }])

    render(<MangasListPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /adicionar manga/i }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'tcb' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    await waitFor(() => expect(screen.getByText('Manga A')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Manga A'))
    fireEvent.click(screen.getByRole('button', { name: /^adicionar$/i }))

    // still on confirm-add before onSuccess — unique label visible
    expect(screen.getByText(/título no plugin/i)).toBeInTheDocument()

    // fire onSuccess
    capturedOnSuccess?.()

    // now back to list step — confirm form gone, filter input visible
    await waitFor(() =>
      expect(screen.queryByText(/título no plugin/i)).not.toBeInTheDocument()
    )
    expect(screen.getByPlaceholderText(/filtrar por título/i)).toBeInTheDocument()
  })

  it('shows plugin id as fallback when plugin name is empty in add manga wizard', () => {
    vi.mocked(pluginsHook.usePlugins).mockReturnValue({
      data: [
        { id: 'tcb', name: 'TCB Scans' },
        { id: 'no-name-plugin', name: '' },
      ],
      isLoading: false,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof pluginsHook.usePlugins>)
    render(<MangasListPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /adicionar manga/i }))
    // plugin with empty name should display its id
    expect(screen.getByRole('option', { name: 'no-name-plugin' })).toBeInTheDocument()
    // plugin with name should still display name
    expect(screen.getByRole('option', { name: 'TCB Scans' })).toBeInTheDocument()
  })

  it('filters mangas by title in select-manga step', async () => {
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([
      { id: 'n1', title: 'Naruto' },
      { id: 'op1', title: 'One Piece' },
    ])
    render(<MangasListPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /adicionar manga/i }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'tcb' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    await waitFor(() => expect(screen.getByText('Naruto')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText(/filtrar manga/i), {
      target: { value: 'Naruto' },
    })

    expect(screen.getByText('Naruto')).toBeInTheDocument()
    expect(screen.queryByText('One Piece')).not.toBeInTheDocument()
  })

  it('renders available mangas with title as key (no duplicate key warnings)', async () => {
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([
      { id: 'x1', title: 'Manga X' },
      { id: 'y1', title: 'Manga Y' },
    ])
    render(<MangasListPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /adicionar manga/i }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'tcb' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    await waitFor(() => expect(screen.getByText('Manga X')).toBeInTheDocument())
    expect(screen.getByText('Manga Y')).toBeInTheDocument()
  })

  it('deduplicates mangas with the same title from the API', async () => {
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([
      { id: 'n1', title: 'Naruto' },
      { id: 'op1', title: 'One Piece' },
      { id: 'n1', title: 'Naruto' }, // duplicate
    ])
    render(<MangasListPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /adicionar manga/i }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'tcb' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    await waitFor(() => expect(screen.getByText('Naruto')).toBeInTheDocument())

    // Should show only one "Naruto" button, not two
    expect(screen.getAllByRole('button', { name: 'Naruto' })).toHaveLength(1)
  })

  it('shows no-results message when filter matches nothing in select-manga step', async () => {
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([
      { id: 'n1', title: 'Naruto' },
      { id: 'op1', title: 'One Piece' },
    ])
    render(<MangasListPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /adicionar manga/i }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'tcb' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    await waitFor(() => expect(screen.getByText('Naruto')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText(/filtrar manga/i), {
      target: { value: 'zzznomatch' },
    })

    expect(screen.getByText(/nenhum manga/i)).toBeInTheDocument()
    expect(screen.queryByText('Naruto')).not.toBeInTheDocument()
  })
})
