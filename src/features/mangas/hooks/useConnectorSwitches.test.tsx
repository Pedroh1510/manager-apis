import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../components/ui/Toast'
import { useConnectorSwitches } from './useConnectorSwitches'
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

describe('useConnectorSwitches', () => {
  it('loads the switch list', async () => {
    vi.mocked(api.fetchConnectorSwitches).mockResolvedValue([
      { id: 'wicomix', url: 'u', enabled: false, disabledAt: null, disabledReason: null, activeLinks: 1 }
    ])
    const { wrapper } = arrange()
    const { result } = renderHook(() => useConnectorSwitches(), { wrapper })
    await waitFor(() => expect(result.current.switches.isSuccess).toBe(true))
    expect(result.current.switches.data?.[0].id).toBe('wicomix')
  })

  it('setSwitch sends the change and invalidates every mangas query', async () => {
    vi.mocked(api.fetchConnectorSwitches).mockResolvedValue([])
    vi.mocked(api.setConnectorSwitch).mockResolvedValue()
    const { wrapper, invalidate } = arrange()
    const { result } = renderHook(() => useConnectorSwitches(), { wrapper })

    await act(() => result.current.setSwitch.mutateAsync({ idPlugin: 'wicomix', enabled: false, reason: 'x' }))

    expect(api.setConnectorSwitch).toHaveBeenCalledWith('wicomix', { enabled: false, reason: 'x' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['mangas'] })
  })
})
