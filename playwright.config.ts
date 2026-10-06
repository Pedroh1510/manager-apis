import { defineConfig, devices } from '@playwright/test';

// Visual checks run against the dev server (`npm run dev` or the compose
// `frontend` service) with every API call mocked inside the spec, so the
// screenshots do not depend on what is in the local database.
export default defineConfig({
	testDir: './e2e',
	outputDir: './test-results/playwright',
	fullyParallel: true,
	reporter: 'list',
	use: {
		baseURL: process.env.VISUAL_BASE_URL ?? 'http://localhost:5173',
		viewport: { width: 1440, height: 900 }
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }]
});
