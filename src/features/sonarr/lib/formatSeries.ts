import type { EpisodeState } from '../services/types';

const BYTES_PER_MIB = 1024 ** 2;
const BYTES_PER_GIB = 1024 ** 3;

const SERIES_STATUS: Record<string, string> = { continuing: 'Continuando', ended: 'Encerrada', upcoming: 'Em breve' };
const EPISODE_STATE: Record<EpisodeState, string> = {
	downloaded: 'Baixado',
	missing: 'Faltando',
	unaired: 'Não exibido',
	tba: 'Sem data'
};
const HEALTH_TYPE: Record<string, string> = { warning: 'Aviso', error: 'Erro' };

/**
 * @example formatBytes(1610612736) // '1.5 GB'
 */
export function formatBytes(bytes: number): string {
	if (bytes >= BYTES_PER_GIB) return `${(bytes / BYTES_PER_GIB).toFixed(1)} GB`;
	return `${Math.round(bytes / BYTES_PER_MIB)} MB`;
}

/**
 * @example formatEpisodeCode(1, 3) // 'S01E03'
 */
export function formatEpisodeCode(seasonNumber: number, episodeNumber: number): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `S${pad(seasonNumber)}E${pad(episodeNumber)}`;
}

/** Unknown Sonarr values pass through so a new status is visible rather than hidden. */
export function seriesStatusLabel(status: string): string {
	return SERIES_STATUS[status] ?? status;
}

export function episodeStateLabel(state: EpisodeState): string {
	return EPISODE_STATE[state];
}

export function healthTypeLabel(type: string): string {
	return HEALTH_TYPE[type] ?? type;
}

/**
 * Poster fallback: first letter of the first two words.
 * @example initialsOf('The Wire') // 'TW'
 */
export function initialsOf(title: string): string {
	return title.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join('');
}
