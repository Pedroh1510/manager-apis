import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePlugins } from './usePlugins'
import * as api from '../services/api'

vi.mock('../services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('usePlugins', () => {
  it('returns plugin list on success', async () => {
    vi.mocked(api.fetchPlugins).mockResolvedValue([{ id: 'tcb', name: 'TCB Scans' }])
    const { result } = renderHook(() => usePlugins(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].id).toBe('tcb')
  })
})
