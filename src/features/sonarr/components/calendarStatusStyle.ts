import type { CalendarStatus } from '../services/types';

/** Legend order: the happy path first, then what needs attention, then what is ignored. */
export const CALENDAR_STATUSES: CalendarStatus[] = ['downloaded', 'missing', 'unaired', 'unmonitored'];

export const CALENDAR_STATUS_LABEL: Record<CalendarStatus, string> = {
	downloaded: 'Baixado',
	missing: 'Faltando',
	unaired: 'Não exibido',
	unmonitored: 'Não monitorado'
};

/** Same tones as the detail's EpisodesTable; the stripe carries the color so the text stays readable. Unmonitored is also faded (decision Q4). */
export const CALENDAR_STATUS_STRIPE: Record<CalendarStatus, string> = {
	downloaded: 'border-l-success',
	missing: 'border-l-danger',
	unaired: 'border-l-text-muted',
	unmonitored: 'border-l-text-subtle opacity-60'
};

export const CALENDAR_STATUS_DOT: Record<CalendarStatus, string> = {
	downloaded: 'bg-success',
	missing: 'bg-danger',
	unaired: 'bg-text-muted',
	unmonitored: 'border border-text-subtle'
};
