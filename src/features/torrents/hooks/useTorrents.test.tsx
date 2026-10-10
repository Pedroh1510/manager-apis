import { act, renderHook } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTorrents } from './useTorrents'
import * as api from '../services/api'
import { createTestQueryClient } from '../../../test/renderWithProviders'

vi.mock('../services/api')

const empty = { counts: { downloading: 0, completed: 0, queued: 0, stopped: 0 }, overallEtaSeconds: null, etaUnknownCount: 0, active: [] }

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('useTorrents', () => {
  it('refetches every 5000ms', async () => {
    vi.mocked(api.fetchTorrents).mockResolvedValue(empty)
    const { result } = renderHook(() => useTorrents(), { wrapper })
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(result.current.isSuccess).toBe(true)
    expect(api.fetchTorrents).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(4999))
    expect(api.fetchTorrents).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(api.fetchTorrents).toHaveBeenCalledTimes(2)
  })
})
