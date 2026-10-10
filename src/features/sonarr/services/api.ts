import { serverHttp } from '../../../lib/http';
import type { SeriesDetail, SeriesSummary, SonarrStatus } from './types';

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
