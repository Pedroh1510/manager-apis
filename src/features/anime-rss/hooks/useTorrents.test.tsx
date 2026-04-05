import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTorrents } from './useTorrents'
import * as api from '../services/api'

vi.mock('../services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useTorrents', () => {
  it('returns active torrents', async () => {
    vi.mocked(api.fetchTorrents).mockResolvedValue([
      { hash: 'abc', name: 'Naruto', state: 'downloading', progress: 0.5, size: 1024, dlspeed: 100 },
    ])
    const { result } = renderHook(() => useTorrents(), { wrapper })
    await waitFor(() => expect(result.current.torrents.isSuccess).toBe(true))
    expect(result.current.torrents.data).toHaveLength(1)
  })

  it('exposes stopTorrent mutation', () => {
    vi.mocked(api.fetchTorrents).mockResolvedValue([])
    const { result } = renderHook(() => useTorrents(), { wrapper })
    expect(result.current.stopTorrent).toBeDefined()
  })

  it('exposes deleteTorrent mutation', () => {
    vi.mocked(api.fetchTorrents).mockResolvedValue([])
    const { result } = renderHook(() => useTorrents(), { wrapper })
    expect(result.current.deleteTorrent).toBeDefined()
  })
})
