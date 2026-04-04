import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRss } from './useRss'
import * as api from '../services/api'

vi.mock('../services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useRss', () => {
  it('calls fetchRss with provided params', async () => {
    vi.mocked(api.fetchRss).mockResolvedValue([{ title: 'Naruto EP1' }])
    const { result } = renderHook(() => useRss({ scanAllItems: true }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.fetchRss).toHaveBeenCalledWith({ scanAllItems: true })
    expect(result.current.data).toHaveLength(1)
  })
})
