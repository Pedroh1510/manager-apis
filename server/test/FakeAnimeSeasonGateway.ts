import { AnimeSeasonGatewayError, type AnimeSeasonGateway } from '../anime/anilistGateway.js'
import type { AnimeSeasonList } from '../anime/animeSeasonTypes.js'
import type { AnimeType, SeasonName } from '../anime/seasonCache.js'

export type RecordedSeasonCall = { method: 'readSeason'; year: number; season: SeasonName; type: AnimeType } | { method: 'readUpcoming'; type: AnimeType }

/**
 * In-memory gateway for route tests; records calls, and `failWith` rejects like the real one does.
 * @example new FakeAnimeSeasonGateway({ list: { items: [], truncated: false } })
 */
export class FakeAnimeSeasonGateway implements AnimeSeasonGateway {
  readonly calls: RecordedSeasonCall[] = []

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
    if (this.data.failWith) throw new AnimeSeasonGatewayError(this.data.failWith)
    return this.data.list ?? { items: [], truncated: false }
  }
}
