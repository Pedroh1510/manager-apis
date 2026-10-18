import { serverHttp } from '../../../lib/http';
import type { AnimeSeasonList, AnimeType, SeasonName } from './types';

export async function fetchAnimeSeason(year: number, season: SeasonName, type: AnimeType): Promise<AnimeSeasonList> {
	const { data } = await serverHttp.get<AnimeSeasonList>(`/anime/seasons/${year}/${season}`, { params: { type } });
	return data;
}

export async function fetchUpcomingAnime(type: AnimeType): Promise<AnimeSeasonList> {
	const { data } = await serverHttp.get<AnimeSeasonList>('/anime/seasons/upcoming', { params: { type } });
	return data;
}
