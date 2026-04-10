import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMangasStatus } from './useMangasStatus'
import * as api from '../services/api'

vi.mock('../services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useMangasStatus', () => {
  it('returns status data on success', async () => {
    vi.mocked(api.fetchMangasStatus).mockResolvedValue({ version: '1.0', maxConnections: 10, openedConnections: 2 })
    const { result } = renderHook(() => useMangasStatus(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ version: '1.0', maxConnections: 10, openedConnections: 2 })
  })
})
