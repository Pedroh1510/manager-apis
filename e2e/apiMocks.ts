import type { Page } from '@playwright/test';

export const MANGAS_API = process.env.VITE_MANGAS_API_URL ?? 'http://localhost:3001';
export const RSS_API = process.env.VITE_RSS_API_URL ?? 'http://localhost:3033';

const connector = (idMangaConnector: number, idPlugin: string, isActive: boolean, titlePlugin: string) => ({
	idMangaConnector,
	idPlugin,
	titlePlugin,
	isActive
});

const manga = (idManga: number, title: string, connectors: ReturnType<typeof connector>[]) => ({
	idManga,
	title,
	createdAt: '2026-10-01T10:00:00.000Z',
	updatedAt: '2026-10-01T10:00:00.000Z',
	connectors
});

export const MANGAS = [
	manga(1, 'Bleach', [connector(1, 'mangeek', true, 'Bleach'), connector(2, 'tcb', false, 'Bleach (TCB)')]),
	manga(2, 'Chainsaw Man', [connector(3, 'tcb', true, 'Chainsaw Man')]),
	manga(3, 'Dandadan', [connector(4, 'mangeek', true, 'Dandadan'), connector(5, 'tcb', true, 'Dandadan')]),
	manga(4, 'Frieren', [connector(6, 'mangeek', false, 'Sousou no Frieren')]),
	manga(5, 'Kagurabachi', []),
	manga(6, 'One Piece', [connector(7, 'tcb', true, 'One Piece')])
];

export const PLUGINS = [
	{ id: 'mangeek', name: 'Mangeek' },
	{ id: 'tcb', name: 'TCB Scans' }
];

/**
 * Answers every API call the screens make with fixed data.
 * @example await mockApis(page)
 */
export async function mockApis(page: Page) {
	await page.route(`${MANGAS_API}/**`, (route) => {
		const { pathname } = new URL(route.request().url());
		if (pathname === '/mangas/adm') return route.fulfill({ json: MANGAS });
		if (pathname === '/mangas/plugins') return route.fulfill({ json: PLUGINS });
		return route.fulfill({ json: {} });
	});
	await page.route(`${RSS_API}/**`, (route) => route.fulfill({ json: [] }));
}
