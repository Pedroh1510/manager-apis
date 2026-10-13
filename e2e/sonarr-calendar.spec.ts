import { expect, test, type Page } from '@playwright/test';

// Day columns depend on the zone; pin it like src/test/setup.ts does for Vitest.
test.use({ timezoneId: 'America/Sao_Paulo' });

const episode = (episodeId: number, seriesTitle: string, airDateUtc: string) => ({
	episodeId, seriesId: episodeId, seriesTitle, seasonNumber: 1, episodeNumber: 1, title: 'Pilot', airDateUtc, status: 'missing'
});

/** Same-origin `/api` only; the calendar needs nothing from the RSS or mangas APIs. */
async function mockSonarr(page: Page) {
	await page.route('**/api/**', (route) => {
		const { pathname } = new URL(route.request().url());
		if (pathname === '/api/config') return route.fulfill({ json: { qbittorrent: false, sonarr: true, sonarrUpload: false, tdarr: false } });
		if (pathname === '/api/sonarr/calendar') {
			return route.fulfill({ json: [episode(1, 'The Wire', '2026-10-12T01:00:00Z'), episode(2, 'Andor', '2026-10-16T01:00:00Z')] });
		}
		return route.fulfill({ json: {} });
	});
}

async function dayBoxes(page: Page) {
	await mockSonarr(page);
	await page.goto('/sonarr/calendario?semana=2026-10-11');
	await expect(page.getByRole('region', { name: 'sáb 17/10' })).toBeVisible();
	return Promise.all(
		['dom 11/10', 'seg 12/10', 'ter 13/10', 'qua 14/10', 'qui 15/10', 'sex 16/10', 'sáb 17/10'].map(
			async (name) => (await page.getByRole('region', { name }).boundingBox())!
		)
	);
}

const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test('stacks days on phones and shows 7 columns on desktop', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 800 });
	const phone = await dayBoxes(page);
	expect(await hasHorizontalScroll(page)).toBe(false);
	for (let index = 1; index < phone.length; index++) expect(phone[index].y).toBeGreaterThan(phone[index - 1].y);

	await page.setViewportSize({ width: 1280, height: 800 });
	const desktop = await dayBoxes(page);
	expect(new Set(desktop.map((box) => Math.round(box.y))).size).toBe(1);
	for (let index = 1; index < desktop.length; index++) expect(desktop[index].x).toBeGreaterThan(desktop[index - 1].x);
});
