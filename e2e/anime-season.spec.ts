import { expect, test, type Page } from '@playwright/test';

// imageUrl null keeps the spec off the MAL CDN; the placeholder keeps the same 2:3 box.
const item = (id: number) => ({
	id, url: `https://myanimelist.net/anime/${id}`, imageUrl: null, title: `Anime de exemplo ${id}`, titleEnglish: `Sample anime ${id}`,
	synopsis: null, type: 'TV', episodes: 12, score: 7.5, scoredBy: 12000, members: 100000 - id, status: 'airing', airedFrom: null,
	broadcast: { day: 'saturday', time: '23:00' }, studios: ['MAPPA'], genres: ['Action', 'Fantasy'], isAdult: false
});

/** Same-origin `/api` only; the season page needs nothing from the RSS or mangas APIs. */
async function mockSeason(page: Page) {
	await page.route('**/api/**', (route) => {
		const { pathname } = new URL(route.request().url());
		if (pathname === '/api/config') return route.fulfill({ json: { qbittorrent: false, sonarr: true, sonarrUpload: false, tdarr: false, anilist: true } });
		if (pathname.startsWith('/api/anime/seasons/')) return route.fulfill({ json: { items: Array.from({ length: 12 }, (_, index) => item(index + 1)), truncated: false } });
		return route.fulfill({ json: {} });
	});
}

async function gridColumns(page: Page): Promise<number> {
	await mockSeason(page);
	await page.goto('/anime/temporadas');
	await expect(page.getByTestId('season-card').first()).toBeVisible();
	return page.getByTestId('season-grid').evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length);
}

test('grid has 2 columns on mobile and 6 on xl', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 800 });
	expect(await gridColumns(page)).toBe(2);
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

	await page.setViewportSize({ width: 1440, height: 900 });
	expect(await gridColumns(page)).toBe(6);
});
