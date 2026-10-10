import type { AxiosAdapter } from 'axios';
import { describe, it, expect } from 'vitest';
import { rssHttp, mangasHttp, serverHttp } from './http';

describe('http clients', () => {
	it('rssHttp has correct baseURL', () => {
		expect(rssHttp.defaults.baseURL).toBe('https://rss.phtecnology.dev.br');
	});

	it('mangasHttp has correct baseURL', () => {
		expect(mangasHttp.defaults.baseURL).toBe(
			'https://mangas.phtecnology.dev.br'
		);
	});

	// Regression: with VITE_RSS_API_URL unset, /queues-summary hit the SPA fallback and the
	// index.html string crashed QueueCards, taking down the whole /status page.
	it('rejects an HTML answer where JSON is expected, naming the URL', async () => {
		const htmlAdapter: AxiosAdapter = async (config) => ({
			data: '<!doctype html><div id="root"></div>',
			status: 200,
			statusText: 'OK',
			headers: { 'content-type': 'text/html; charset=utf-8' },
			config
		});
		for (const client of [rssHttp, mangasHttp, serverHttp]) {
			await expect(client.get('/queues-summary', { adapter: htmlAdapter })).rejects.toThrow(
				/resposta HTML em vez de JSON em .*\/queues-summary/
			);
		}
	});

	it('still passes JSON answers through', async () => {
		const jsonAdapter: AxiosAdapter = async (config) => ({
			data: [{ name: 'download' }],
			status: 200,
			statusText: 'OK',
			headers: { 'content-type': 'application/json' },
			config
		});
		const { data } = await rssHttp.get('/queues-summary', { adapter: jsonAdapter });
		expect(data).toEqual([{ name: 'download' }]);
	});
});
