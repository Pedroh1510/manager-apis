import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQueuesSummary } from './useQueuesSummary'
import * as api from '../services/api'
import { createTestQueryClient } from '../../../test/renderWithProviders'

vi.mock('../services/api')

function Probe() {
  const query = useQueuesSummary('mangas')
  return <button onClick={() => query.refetch()}>Atualizar</button>
}

beforeEach(() => vi.resetAllMocks())

describe('useQueuesSummary', () => {
  it('refetches on demand and never polls', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(api.fetchMangasQueuesSummary).mockResolvedValue([])
    const client = createTestQueryClient()
    render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>
    )
    await waitFor(() => expect(api.fetchMangasQueuesSummary).toHaveBeenCalledTimes(1))

    await vi.advanceTimersByTimeAsync(5 * 60_000)
    expect(api.fetchMangasQueuesSummary).toHaveBeenCalledTimes(1)
    expect(client.getQueryCache().find({ queryKey: ['queues', 'mangas'] })?.options).not.toHaveProperty('refetchInterval')

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
    await waitFor(() => expect(api.fetchMangasQueuesSummary).toHaveBeenCalledTimes(2))
    vi.useRealTimers()
  })
})
