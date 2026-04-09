import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/test/setup.ts',
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
