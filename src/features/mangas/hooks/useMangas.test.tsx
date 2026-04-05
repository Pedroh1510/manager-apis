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
      { title: 'Naruto', titleInPlugin: 'Naruto', idPlugin: 'tcb' },
    ])
    const { result } = renderHook(() => useMangas(), { wrapper })
    await waitFor(() => expect(result.current.mangas.isSuccess).toBe(true))
    expect(result.current.mangas.data).toHaveLength(1)
  })

  it('exposes deleteManga mutation', () => {
    vi.mocked(api.fetchMangaList).mockResolvedValue([])
    const { result } = renderHook(() => useMangas(), { wrapper })
    expect(result.current.deleteManga).toBeDefined()
  })

  it('exposes addManga mutation', () => {
    vi.mocked(api.fetchMangaList).mockResolvedValue([])
    const { result } = renderHook(() => useMangas(), { wrapper })
    expect(result.current.addManga).toBeDefined()
  })
})
