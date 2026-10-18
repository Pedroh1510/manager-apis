import type { JikanGateway } from './jikanGateway.js'
import type { AnimeSeasonList } from './jikanSeasonItems.js'
import { SeasonCache, type AnimeType, type SeasonName } from './seasonCache.js'

/**
 * Puts the season cache (door 2) in front of any gateway; the routes only see `JikanGateway`.
 * @example createApp({ ..., jikan: new CachedJikanGateway(new FetchJikanGateway(config.jikan)) })
 */
export class CachedJikanGateway implements JikanGateway {
  constructor(
    private readonly inner: JikanGateway,
    private readonly cache = new SeasonCache<AnimeSeasonList>(),
  ) {}

  readSeason(year: number, season: SeasonName, type: AnimeType): Promise<AnimeSeasonList> {
    return this.cache.get({ kind: 'season', year, season, type }, () => this.inner.readSeason(year, season, type))
  }

  readUpcoming(type: AnimeType): Promise<AnimeSeasonList> {
    return this.cache.get({ kind: 'upcoming', type }, () => this.inner.readUpcoming(type))
  }
}
