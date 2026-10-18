import type { AiringStatus, AnimeSeasonItem, Weekday } from '../services/types';

export const WEEKDAY_SHORT: Record<Weekday, string> = {
	monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui', friday: 'Sex', saturday: 'Sáb', sunday: 'Dom'
};

export const WEEKDAY_LONG: Record<Weekday, string> = {
	monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo'
};

export const STATUS_LABELS: Record<AiringStatus, string> = { airing: 'Em exibição', notYetAired: 'Ainda não exibido', finished: 'Finalizado' };

const scoreFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const compactFormat = new Intl.NumberFormat('pt-BR', { notation: 'compact' });
// Server dates are UTC midnights; reading them in the viewer's zone would show the day before.
const premiereFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

/** "8,7" */
export function formatScore(score: number): string {
	return scoreFormat.format(score);
}

/**
 * Votes and members, abbreviated with a plain space.
 * @example formatCount(120000) // '120 mil'
 */
export function formatCount(count: number): string {
	return compactFormat.format(count).replace(/\s/g, ' ');
}

/** "28 ep." or "? ep." while MAL does not know yet. */
export function formatEpisodes(episodes: number | null): string {
	return `${episodes ?? '?'} ep.`;
}

/** "Sáb 23:00 JST" - Japan's broadcast zone, not converted (decision Q8). */
export function formatBroadcast(broadcast: NonNullable<AnimeSeasonItem['broadcast']>): string {
	return `${WEEKDAY_SHORT[broadcast.day]} ${broadcast.time} JST`;
}

/**
 * The upcoming card's date line.
 * @example formatPremiere('2027-01-09T00:00:00+00:00') // 'Estreia 09/01/2027'
 */
export function formatPremiere(airedFrom: string | null): string {
	return airedFrom ? `Estreia ${premiereFormat.format(new Date(airedFrom))}` : 'Sem data';
}
