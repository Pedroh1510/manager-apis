const DATE_TIME = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/**
 * Short pt-BR date and time for tables.
 * @example formatDateTime('2026-10-01T10:00:00Z') // '01/10/2026, 07:00' in America/Sao_Paulo
 */
export function formatDateTime(iso: string): string {
	return DATE_TIME.format(new Date(iso));
}

const DATE_ONLY = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

/**
 * Short pt-BR date in the viewer's timezone.
 * @example formatDate('2002-06-16T01:00:00Z') // '15/06/2002' in America/Sao_Paulo
 */
export function formatDate(iso: string): string {
	return DATE_ONLY.format(new Date(iso));
}
