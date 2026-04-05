import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAdminActions } from './useAdminActions'
import * as api from '../services/api'

vi.mock('../services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useAdminActions', () => {
  it('exposes updateCookie mutation', () => {
    const { result } = renderHook(() => useAdminActions(), { wrapper })
    expect(result.current.updateCookie).toBeDefined()
  })

  it('exposes updateCredentials mutation', () => {
    const { result } = renderHook(() => useAdminActions(), { wrapper })
    expect(result.current.updateCredentials).toBeDefined()
  })

  it('exposes updateMangasByPlugin mutation', () => {
    const { result } = renderHook(() => useAdminActions(), { wrapper })
    expect(result.current.updateMangasByPlugin).toBeDefined()
  })
})
