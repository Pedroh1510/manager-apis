interface DisabledState {
	disabledAt: string | null;
	disabledReason: string | null;
}

/**
 * One-line explanation of a disabled connector, shared by the admin list and
 * the badge on the manga detail page.
 * @example describeDisabled({ disabledAt: '2026-11-14T15:00:00Z', disabledReason: 'paywall' }) // 'desligado em 14/11/2026 — paywall'
 */
export function describeDisabled({ disabledAt, disabledReason }: DisabledState): string {
	if (!disabledAt) return 'conector desligado';
	const date = new Date(disabledAt).toLocaleDateString('pt-BR');
	return disabledReason ? `desligado em ${date} — ${disabledReason}` : `desligado em ${date}`;
}
