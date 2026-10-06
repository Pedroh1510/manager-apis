import { expect, test, type Page } from '@playwright/test';
import { mockApis } from './apiMocks';

const THEMES = ['light', 'dark'] as const;
const SHOTS_DIR = 'test-results/visual';

async function open(page: Page, path: string, theme: (typeof THEMES)[number]) {
	await page.addInitScript((value) => localStorage.setItem('manager-apis-theme', value), theme);
	await mockApis(page);
	await page.goto(path);
	await page.evaluate(() => document.fonts.ready);
}

for (const theme of THEMES) {
	test.describe(`${theme} theme`, () => {
		test('mangas list', async ({ page }) => {
			await open(page, '/mangas/list', theme);
			await expect(page.getByText('Kagurabachi')).toBeVisible();
			await page.screenshot({ path: `${SHOTS_DIR}/mangas-list-${theme}.png`, fullPage: true });
		});

		test('mangas list with no match', async ({ page }) => {
			await open(page, '/mangas/list?q=zzz', theme);
			await expect(page.getByText('Nenhum mangá com esses filtros')).toBeVisible();
			await page.screenshot({ path: `${SHOTS_DIR}/mangas-list-no-match-${theme}.png` });
		});

		test('manga detail with missing chapters', async ({ page }) => {
			await open(page, '/mangas/1', theme);
			await expect(page.getByRole('heading', { name: 'Bleach' })).toBeVisible();
			await page.getByRole('button', { name: 'Verificar faltantes' }).click();
			await expect(page.getByText('Capítulo 5')).toBeVisible();
			await page.screenshot({ path: `${SHOTS_DIR}/manga-detail-${theme}.png`, fullPage: true });
		});

		test('add manga drawer', async ({ page }) => {
			await open(page, '/mangas/list', theme);
			await page.getByRole('button', { name: 'Adicionar mangá' }).click();
			await expect(page.getByRole('dialog', { name: 'Adicionar mangá' })).toBeVisible();
			await page.screenshot({ path: `${SHOTS_DIR}/add-manga-drawer-${theme}.png` });
		});
	});
}

test('fonts are served locally', async ({ page }) => {
	const externalFontRequests: string[] = [];
	page.on('request', (request) => {
		if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) externalFontRequests.push(request.url());
	});
	await open(page, '/mangas/list', 'light');
	const loaded = await page.evaluate(async () => {
		const [inter, mono] = await Promise.all([
			document.fonts.load('14px Inter', 'Mangás'),
			document.fonts.load('12px "JetBrains Mono"', 'mangeek')
		]);
		return { inter: inter.map((face) => face.family), mono: mono.map((face) => face.family) };
	});
	expect(loaded.inter).toContain('Inter');
	expect(loaded.mono).toContain('JetBrains Mono');
	expect(externalFontRequests).toEqual([]);
});
