import { JikanGatewayError, type JikanGateway } from '../jikan/jikanGateway.js'
import type { AnimeSeasonList } from '../jikan/jikanSeasonItems.js'
import type { AnimeType, SeasonName } from '../jikan/seasonCache.js'

export type RecordedJikanCall = { method: 'readSeason'; year: number; season: SeasonName; type: AnimeType } | { method: 'readUpcoming'; type: AnimeType }

/**
 * In-memory gateway for route tests; records calls, and `failWith` rejects like the real one does.
 * @example new FakeJikanGateway({ list: { items: [], truncated: false } })
 */
export class FakeJikanGateway implements JikanGateway {
  readonly calls: RecordedJikanCall[] = []

  constructor(readonly data: { list?: AnimeSeasonList; failWith?: string } = {}) {}

  async readSeason(year: number, season: SeasonName, type: AnimeType): Promise<AnimeSeasonList> {
    this.calls.push({ method: 'readSeason', year, season, type })
    return this.answer()
  }

  async readUpcoming(type: AnimeType): Promise<AnimeSeasonList> {
    this.calls.push({ method: 'readUpcoming', type })
    return this.answer()
  }

  private answer(): AnimeSeasonList {
    if (this.data.failWith) throw new JikanGatewayError(this.data.failWith)
    return this.data.list ?? { items: [], truncated: false }
  }
}
