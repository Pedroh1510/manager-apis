import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mangasHttp } from '../../../lib/http'
import { fetchPendingMigrations, runMigrations } from './api'

vi.mock('../../../lib/http', () => ({ mangasHttp: { get: vi.fn(), post: vi.fn() } }))

beforeEach(() => vi.clearAllMocks())

describe('migrations endpoints', () => {
  it('GET and POST /migrations on the mangas API', async () => {
    vi.mocked(mangasHttp.get).mockResolvedValue({ data: [{ name: 'a' }] })
    vi.mocked(mangasHttp.post).mockResolvedValue({ data: [{ name: 'a' }] })

    expect(await fetchPendingMigrations()).toEqual([{ name: 'a' }])
    expect(await runMigrations()).toEqual([{ name: 'a' }])
    expect(mangasHttp.get).toHaveBeenCalledWith('/migrations')
    expect(mangasHttp.post).toHaveBeenCalledWith('/migrations')
  })
})
