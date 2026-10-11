import type { MonitorOption, SeriesType } from '../services/types';

export const SERIES_TYPE_OPTIONS: { value: SeriesType; label: string }[] = [
	{ value: 'standard', label: 'Padrão' },
	{ value: 'anime', label: 'Anime' },
	{ value: 'daily', label: 'Diário' }
];

export const MONITOR_OPTIONS: { value: MonitorOption; label: string }[] = [
	{ value: 'all', label: 'Todos' },
	{ value: 'future', label: 'Futuros' },
	{ value: 'none', label: 'Nenhum' },
	{ value: 'firstSeason', label: '1ª temporada' },
	{ value: 'lastSeason', label: 'Última temporada' }
];

/**
 * Sonarr's lookup always says `standard`, even for anime; TVDB's "Anime" genre is the better hint (decision A2').
 * @example suggestSeriesType(['Animation', 'Anime']) // 'anime'
 */
export function suggestSeriesType(genres: string[]): SeriesType {
	return genres.includes('Anime') ? 'anime' : 'standard';
}
