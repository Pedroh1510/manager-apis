import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	// The Express server in server/ owns /api; same path in dev and in the container.
	server: {
		proxy: { '/api': 'http://localhost:3002' }
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/test/setup.ts',
		// e2e/ holds Playwright specs, run with `npm run test:visual`.
		exclude: [...configDefaults.exclude, 'e2e/**'],
		env: {
			VITE_RSS_API_URL: 'https://rss.phtecnology.dev.br',
			VITE_MANGAS_API_URL: 'https://mangas.phtecnology.dev.br'
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			exclude: ['src/main.tsx', 'src/test/**']
		}
	}
});
