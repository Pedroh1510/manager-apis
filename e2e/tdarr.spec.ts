import { expect, test, type Page } from '@playwright/test';

const node = (id: string, name: string) => ({
	id, name, paused: false, online: true, busyWorkers: 0, workerCapacity: 2,
	workerLimits: { transcodeGpu: 2, transcodeCpu: 0, healthCheckGpu: 0, healthCheckCpu: 0 }, workers: []
});

const errors = { total: 0, items: [] };

/** Same-origin `/api` only; the Tdarr page needs nothing from the RSS or mangas APIs. */
async function mockTdarr(page: Page) {
	await page.route('**/api/**', (route) => {
		const { pathname } = new URL(route.request().url());
		if (pathname === '/api/config') return route.fulfill({ json: { qbittorrent: false, sonarr: false, sonarrUpload: false, tdarr: true, anilist: false } });
		if (pathname === '/api/tdarr/overview') return route.fulfill({ json: { version: '2.94.02', nodes: [node('pc', 'pc-rtx2060'), node('cpu', 'homelab-cpu')] } });
		if (pathname === '/api/tdarr/stats') {
			return route.fulfill({
				json: {
					totals: { files: 2816, transcodes: 3278, healthChecks: 5310, spaceSavedGb: 592.95 },
					transcode: { onHold: 0, queued: 48, succeeded: 2766, failed: 0 },
					healthCheck: { queued: 0, succeeded: 2814, failed: 0 },
					errors: { transcode: errors, healthCheck: errors }
				}
			});
		}
		return route.fulfill({ json: {} });
	});
}

async function nodeBoxes(page: Page) {
	await mockTdarr(page);
	await page.goto('/tdarr');
	await expect(page.getByRole('heading', { name: 'homelab-cpu', level: 3 })).toBeVisible();
	return Promise.all(['pc-rtx2060', 'homelab-cpu'].map(async (name) => (await page.getByTestId('tdarr-node').filter({ hasText: name }).boundingBox())!));
}

const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test('stacks cards on phones and puts nodes side by side on desktop', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 800 });
	const phone = await nodeBoxes(page);
	expect(await hasHorizontalScroll(page)).toBe(false);
	expect(phone[1].y).toBeGreaterThan(phone[0].y);

	await page.setViewportSize({ width: 1280, height: 800 });
	const desktop = await nodeBoxes(page);
	expect(Math.round(desktop[1].y)).toBe(Math.round(desktop[0].y));
	expect(desktop[1].x).toBeGreaterThan(desktop[0].x);
});
