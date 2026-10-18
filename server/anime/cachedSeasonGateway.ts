import type { AnimeSeasonGateway } from './anilistGateway.js'
import type { AnimeSeasonList } from './animeSeasonTypes.js'
import { SeasonCache, type AnimeType, type SeasonName } from './seasonCache.js'

/**
 * Puts the season cache (door 2) in front of any gateway; the routes only see `AnimeSeasonGateway`.
 * @example createApp({ ..., animeSeasons: new CachedSeasonGateway(new GraphqlAniListGateway(config.anilist)) })
 */
export class CachedSeasonGateway implements AnimeSeasonGateway {
  constructor(
    private readonly inner: AnimeSeasonGateway,
    private readonly cache = new SeasonCache<AnimeSeasonList>(),
  ) {}

  readSeason(year: number, season: SeasonName, type: AnimeType): Promise<AnimeSeasonList> {
    return this.cache.get({ kind: 'season', year, season, type }, () => this.inner.readSeason(year, season, type))
  }

  readUpcoming(type: AnimeType): Promise<AnimeSeasonList> {
    return this.cache.get({ kind: 'upcoming', type }, () => this.inner.readUpcoming(type))
  }
}
