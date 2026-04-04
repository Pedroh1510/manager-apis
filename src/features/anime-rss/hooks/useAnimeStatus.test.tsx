import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAnimeStatus } from './useAnimeStatus'
import * as api from '../services/api'

vi.mock('../services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useAnimeStatus', () => {
  it('returns status data on success', async () => {
    vi.mocked(api.fetchAnimeStatus).mockResolvedValue({ status: 'ok' })
    const { result } = renderHook(() => useAnimeStatus(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ status: 'ok' })
  })

  it('returns error state on failure', async () => {
    vi.mocked(api.fetchAnimeStatus).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useAnimeStatus(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
