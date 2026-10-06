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

export const CHAPTERS = [
	{ idChapter: 11, idMangaConnector: 1, idChapterPlugin: 'b-1', name: 'Capítulo 1', volume: '1.0000', downloadedAt: '2026-09-30T21:10:00.000Z' },
	{ idChapter: 12, idMangaConnector: 1, idChapterPlugin: 'b-2', name: 'Capítulo 2', volume: '2.0000', downloadedAt: '2026-10-01T09:42:00.000Z' },
	{ idChapter: 13, idMangaConnector: 1, idChapterPlugin: 'b-2.5', name: 'Capítulo 2.5 — Extra', volume: '2.5000', downloadedAt: null },
	{ idChapter: 14, idMangaConnector: 1, idChapterPlugin: 'b-3', name: 'Capítulo 3', volume: '3.0000', downloadedAt: null }
];

export const MISSING_CHAPTERS = [
	{ id: 'b-4', title: 'Capítulo 4', volume: 4, idMangaConnector: 1 },
	{ id: 'b-5', title: 'Capítulo 5', volume: 5, idMangaConnector: 1 }
];

const counts = (active: number, waiting: number, delayed: number, failed: number) => ({
	active,
	waiting,
	delayed,
	failed,
	completed: 120,
	paused: 0
});

export const MANGAS_QUEUES = [
	{ name: 'background-tasks', counts: counts(1, 0, 2, 0) },
	{ name: 'connector-mangeek', counts: counts(1, 14, 0, 3) },
	{ name: 'download', counts: counts(3, 41, 0, 0) }
];

export const RSS_QUEUES = [
	{ name: 'Adm Anime', counts: counts(0, 0, 1, 0) },
	{ name: 'Anime process', counts: counts(0, 0, 1, 0) },
	{ name: 'Scan process', counts: counts(1, 2, 0, 0) }
];

export const PENDING_MIGRATIONS = [
	{ name: '1760000000000_add-connector-priority', path: 'src/infra/migrations/1760000000000_add-connector-priority.cjs', timestamp: 1760000000000 }
];

const BULL_BOARD_PLACEHOLDER = '<body style="margin:0;font:13px sans-serif;display:grid;place-items:center;height:100vh;background:#f4f5f7;color:#6b7280">bull-board</body>';

export const TORRENTS = [
	{ hash: 'a1', name: '[SubsPlease] Sousou no Frieren - 28 (1080p) [A1B2C3D4].mkv', state: 'downloading', progress: 0.62, size: 1, dlspeed: 1 },
	{ hash: 'b2', name: '[Erai-raws] Dandadan - 12 [1080p][Multiple Subtitle].mkv', state: 'stalledUP', progress: 1, size: 1, dlspeed: 0 },
	{ hash: 'c3', name: '[SubsPlease] Kagurabachi - 03 (1080p).mkv', state: 'pausedDL', progress: 0.08, size: 1, dlspeed: 0 }
];

export const RSS_ITEMS = [
	{ title: '[SubsPlease] Sousou no Frieren - 28 (1080p)', pubDate: '2026-10-05T18:30:00.000Z' },
	{ title: '[Erai-raws] Dandadan - 12 [1080p][Multiple Subtitle]', pubDate: '2026-10-05T16:02:00.000Z' },
	{ title: '[SubsPlease] Kagurabachi - 03 (1080p)', pubDate: '2026-10-04T22:15:00.000Z' }
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
		if (pathname === '/status') return route.fulfill({ json: { version: '16.4', maxConnections: 100, openedConnections: 7 } });
		if (pathname === '/migrations') return route.fulfill({ json: PENDING_MIGRATIONS });
		if (pathname === '/queues-summary') return route.fulfill({ json: MANGAS_QUEUES });
		if (pathname.startsWith('/queues')) return route.fulfill({ contentType: 'text/html', body: BULL_BOARD_PLACEHOLDER });
		if (pathname === '/mangas/plugins') return route.fulfill({ json: PLUGINS });
		if (/^\/mangas\/adm\/\d+\/chapters\/missing$/.test(pathname)) return route.fulfill({ json: MISSING_CHAPTERS });
		if (/^\/mangas\/adm\/\d+\/chapters$/.test(pathname)) return route.fulfill({ json: CHAPTERS });
		return route.fulfill({ json: {} });
	});
	await page.route(`${RSS_API}/**`, (route) => {
		const { pathname } = new URL(route.request().url());
		if (pathname === '/status')
			return route.fulfill({
				json: { database: { version: '16.4', maxConnections: 100, activeConnections: 3 }, qbittorrent: { version: 'v5.0.4', apiVersion: '2.11.2' } }
			});
		if (pathname === '/queues-summary') return route.fulfill({ json: RSS_QUEUES });
		if (pathname === '/adm/torrents') return route.fulfill({ json: TORRENTS });
		if (pathname === '/rss/json') return route.fulfill({ json: RSS_ITEMS });
		if (pathname === '/rss' && route.request().method() === 'POST')
			return route.fulfill({ status: 409, json: { statusCode: 409, message: 'Torrent with title already exists', error: 'Conflict' } });
		if (pathname.startsWith('/queues')) return route.fulfill({ contentType: 'text/html', body: BULL_BOARD_PLACEHOLDER });
		return route.fulfill({ json: [] });
	});
}
