import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mangasHttp, rssHttp } from '../../../lib/http'
import { fetchMangasQueuesSummary, fetchRssQueuesSummary } from './api'

vi.mock('../../../lib/http', () => ({ mangasHttp: { get: vi.fn() }, rssHttp: { get: vi.fn() } }))

beforeEach(() => vi.clearAllMocks())

describe('queues summary endpoints', () => {
  it('reads /queues-summary from each API', async () => {
    vi.mocked(mangasHttp.get).mockResolvedValue({ data: [{ name: 'download' }] })
    vi.mocked(rssHttp.get).mockResolvedValue({ data: [{ name: 'Scan process' }] })

    expect(await fetchMangasQueuesSummary()).toEqual([{ name: 'download' }])
    expect(await fetchRssQueuesSummary()).toEqual([{ name: 'Scan process' }])
    expect(mangasHttp.get).toHaveBeenCalledWith('/queues-summary')
    expect(rssHttp.get).toHaveBeenCalledWith('/queues-summary')
  })
})
