import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMangas } from './useMangas'
import * as api from '../services/api'

vi.mock('../services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useMangas', () => {
  it('returns manga list on success', async () => {
    vi.mocked(api.fetchMangaList).mockResolvedValue([
      { idManga: 1, title: 'Naruto', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ])
    const { result } = renderHook(() => useMangas(), { wrapper })
    await waitFor(() => expect(result.current.mangas.isSuccess).toBe(true))
    expect(result.current.mangas.data).toHaveLength(1)
  })

  it('exposes deleteManga mutation and calls DELETE with idManga', async () => {
    vi.mocked(api.fetchMangaList).mockResolvedValue([])
    vi.mocked(api.deleteManga).mockResolvedValue(undefined)
    const { result } = renderHook(() => useMangas(), { wrapper })
    result.current.deleteManga.mutate(42)
    await waitFor(() => expect(api.deleteManga).toHaveBeenCalledWith(42))
  })

  it('exposes addManga mutation and creates manga then links connector', async () => {
    vi.mocked(api.fetchMangaList).mockResolvedValue([])
    vi.mocked(api.addManga).mockResolvedValue({ idManga: 7 })
    vi.mocked(api.linkConnector).mockResolvedValue(undefined)
    const { result } = renderHook(() => useMangas(), { wrapper })
    result.current.addManga.mutate({
      title: 'Naruto',
      idPlugin: 'tcb',
      idMangaPlugin: 'abc',
      titlePlugin: 'Naruto',
    })
    await waitFor(() => expect(result.current.addManga.isSuccess).toBe(true))
    expect(api.addManga).toHaveBeenCalledWith({ title: 'Naruto' })
    expect(api.linkConnector).toHaveBeenCalledWith(7, {
      idPlugin: 'tcb',
      idMangaPlugin: 'abc',
      titlePlugin: 'Naruto',
    })
  })
})
