import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../components/ui/Toast'
import { useChapterFixes } from './useChapterFixes'
import * as api from '../services/api'

vi.mock('../services/api')

function arrange() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    )
  }
  return { wrapper, invalidate }
}

const chaptersKey = { queryKey: ['mangas', 1, 'chapters'] }
const blockedKey = { queryKey: ['mangas', 1, 'blocked-chapters'] }

describe('useChapterFixes', () => {
  it('loads the blocked chapters', async () => {
    vi.mocked(api.fetchBlockedChapters).mockResolvedValue([])
    const { wrapper } = arrange()
    const { result } = renderHook(() => useChapterFixes(1), { wrapper })
    await waitFor(() => expect(result.current.blocked.isSuccess).toBe(true))
    expect(api.fetchBlockedChapters).toHaveBeenCalledWith(1)
  })

  it('sources returns the candidates without invalidating anything', async () => {
    vi.mocked(api.fetchBlockedChapters).mockResolvedValue([])
    vi.mocked(api.fetchChapterSources).mockResolvedValue([])
    const { wrapper, invalidate } = arrange()
    const { result } = renderHook(() => useChapterFixes(1), { wrapper })
    await act(() => result.current.sources.mutateAsync(5))
    expect(api.fetchChapterSources).toHaveBeenCalledWith(1, 5)
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('replace sends the new source and invalidates chapters and blocked', async () => {
    vi.mocked(api.fetchBlockedChapters).mockResolvedValue([])
    vi.mocked(api.replaceChapterSource).mockResolvedValue()
    const { wrapper, invalidate } = arrange()
    const { result } = renderHook(() => useChapterFixes(1), { wrapper })
    await act(() => result.current.replace.mutateAsync({ idChapter: 5, idMangaConnector: 3, idChapterPlugin: 'c' }))
    expect(api.replaceChapterSource).toHaveBeenCalledWith(1, 5, { idMangaConnector: 3, idChapterPlugin: 'c' })
    expect(invalidate).toHaveBeenCalledWith(chaptersKey)
    expect(invalidate).toHaveBeenCalledWith(blockedKey)
  })

  it('block invalidates chapters and blocked', async () => {
    vi.mocked(api.fetchBlockedChapters).mockResolvedValue([])
    vi.mocked(api.blockChapter).mockResolvedValue()
    const { wrapper, invalidate } = arrange()
    const { result } = renderHook(() => useChapterFixes(1), { wrapper })
    await act(() => result.current.block.mutateAsync({ idChapter: 5, reason: 'x' }))
    expect(api.blockChapter).toHaveBeenCalledWith(1, 5, 'x')
    expect(invalidate).toHaveBeenCalledWith(chaptersKey)
    expect(invalidate).toHaveBeenCalledWith(blockedKey)
  })

  it('unblock invalidates chapters and blocked', async () => {
    vi.mocked(api.fetchBlockedChapters).mockResolvedValue([])
    vi.mocked(api.unblockChapter).mockResolvedValue()
    const { wrapper, invalidate } = arrange()
    const { result } = renderHook(() => useChapterFixes(1), { wrapper })
    await act(() => result.current.unblock.mutateAsync(2))
    expect(api.unblockChapter).toHaveBeenCalledWith(1, 2)
    expect(invalidate).toHaveBeenCalledWith(chaptersKey)
    expect(invalidate).toHaveBeenCalledWith(blockedKey)
  })
})
