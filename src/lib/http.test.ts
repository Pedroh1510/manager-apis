import { describe, it, expect } from 'vitest';
import { rssHttp, mangasHttp } from './http';

describe('http clients', () => {
	it('rssHttp has correct baseURL', () => {
		expect(rssHttp.defaults.baseURL).toBe('https://rss.phtecnology.dev.br');
	});

	it('mangasHttp has correct baseURL', () => {
		expect(mangasHttp.defaults.baseURL).toBe(
			'https://mangas.phtecnology.dev.br'
		);
	});
});
