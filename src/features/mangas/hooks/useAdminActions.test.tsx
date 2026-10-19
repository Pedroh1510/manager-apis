import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../components/ui/Toast'
import { useAdminActions } from './useAdminActions'

vi.mock('../services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>{children}</ToastProvider>
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

  it('exposes searchChapters mutation', () => {
    const { result } = renderHook(() => useAdminActions(), { wrapper })
    expect(result.current.searchChapters).toBeDefined()
  })

  it('exposes refreshCatalog mutation', () => {
    const { result } = renderHook(() => useAdminActions(), { wrapper })
    expect(result.current.refreshCatalog).toBeDefined()
  })

  it('exposes syncCovers mutation', () => {
    const { result } = renderHook(() => useAdminActions(), { wrapper })
    expect(result.current.syncCovers).toBeDefined()
  })

  it('exposes cleanKavita mutation', () => {
    const { result } = renderHook(() => useAdminActions(), { wrapper })
    expect(result.current.cleanKavita).toBeDefined()
  })
})
