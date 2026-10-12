import { serverHttp } from '../../../lib/http';
import type {
	AddOptions,
	AddSeriesInput,
	MissingPage,
	ReleaseQuery,
	ReleaseSummary,
	SeriesDetail,
	SeriesLookupResult,
	SeriesSummary,
	SonarrStatus
} from './types';

export async function fetchSeriesList(): Promise<SeriesSummary[]> {
	const { data } = await serverHttp.get<SeriesSummary[]>('/sonarr/series');
	return data;
}

export async function fetchSeriesDetail(seriesId: number): Promise<SeriesDetail> {
	const { data } = await serverHttp.get<SeriesDetail>(`/sonarr/series/${seriesId}`);
	return data;
}

export async function fetchSonarrStatus(): Promise<SonarrStatus> {
	const { data } = await serverHttp.get<SonarrStatus>('/sonarr/status');
	return data;
}

/** Served by server/ from Sonarr's local cover, cached for a day by the browser. */
export function seriesPosterUrl(seriesId: number): string {
	return `/api/sonarr/series/${seriesId}/poster`;
}

export async function setEpisodesMonitored(episodeIds: number[], monitored: boolean): Promise<void> {
	await serverHttp.put('/sonarr/episodes/monitor', { episodeIds, monitored });
}

export async function setSeasonMonitored(seriesId: number, seasonNumber: number, monitored: boolean): Promise<void> {
	await serverHttp.put(`/sonarr/series/${seriesId}/seasons/${seasonNumber}/monitor`, { monitored });
}

export async function searchEpisode(episodeId: number): Promise<void> {
	await serverHttp.post(`/sonarr/episodes/${episodeId}/search`);
}

export async function searchSeason(seriesId: number, seasonNumber: number): Promise<void> {
	await serverHttp.post(`/sonarr/series/${seriesId}/seasons/${seasonNumber}/search`);
}

export async function fetchReleases(query: ReleaseQuery): Promise<ReleaseSummary[]> {
	const { data } = await serverHttp.get<ReleaseSummary[]>('/sonarr/releases', { params: query });
	return data;
}

export async function grabRelease(release: { guid: string; indexerId: number }): Promise<void> {
	await serverHttp.post('/sonarr/releases', release);
}

export async function lookupSeries(term: string): Promise<SeriesLookupResult[]> {
	const { data } = await serverHttp.get<SeriesLookupResult[]>('/sonarr/lookup', { params: { term } });
	return data;
}

export async function fetchAddOptions(): Promise<AddOptions> {
	const { data } = await serverHttp.get<AddOptions>('/sonarr/add-options');
	return data;
}

/** Resolves to the id Sonarr gave the new series. */
export async function addSeries(input: AddSeriesInput): Promise<number> {
	const { data } = await serverHttp.post<{ id: number }>('/sonarr/series', input);
	return data.id;
}

export async function fetchMissing(page: number): Promise<MissingPage> {
	const { data } = await serverHttp.get<MissingPage>('/sonarr/missing', { params: { page } });
	return data;
}

export async function searchEpisodes(episodeIds: number[]): Promise<void> {
	await serverHttp.post('/sonarr/episodes/search', { episodeIds });
}

export async function searchAllMissing(): Promise<void> {
	await serverHttp.post('/sonarr/missing/search');
}
