import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mangasHttp } from '../../../lib/http';
import {
	fetchMangasStatus,
	fetchPlugins,
	updateCookie,
	updateCredentials,
	updateMangasByPlugin,
	fetchMangaList,
	deleteManga,
	fetchMangasByPlugin,
	addManga,
	linkConnector
} from './api';

vi.mock('../../../lib/http', () => ({
	mangasHttp: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn()
	}
}));

const mockGet = vi.mocked(mangasHttp.get);
const mockPost = vi.mocked(mangasHttp.post);
const mockDelete = vi.mocked(mangasHttp.delete);

beforeEach(() => vi.clearAllMocks());

describe('fetchMangasStatus', () => {
	it('calls GET /status', async () => {
		mockGet.mockResolvedValue({ data: { status: 'ok' } });
		const result = await fetchMangasStatus();
		expect(mockGet).toHaveBeenCalledWith('/status');
		expect(result).toEqual({ status: 'ok' });
	});
});

describe('fetchPlugins', () => {
	it('calls GET /mangas/plugins', async () => {
		mockGet.mockResolvedValue({ data: [{ id: 'tcb', name: 'TCB Scans' }] });
		const result = await fetchPlugins();
		expect(mockGet).toHaveBeenCalledWith('/mangas/plugins');
		expect(result).toHaveLength(1);
	});
});

describe('updateCookie', () => {
	it('calls POST /mangas/adm/cookie with plugin and cookie', async () => {
		mockPost.mockResolvedValue({ data: {} });
		await updateCookie({ idPlugin: 'tcb', cookie: 'session=abc' });
		expect(mockPost).toHaveBeenCalledWith('/mangas/adm/cookie', {
			idPlugin: 'tcb',
			cookie: 'session=abc'
		});
	});
});

describe('updateCredentials', () => {
	it('calls POST /mangas/adm/credentials with payload', async () => {
		mockPost.mockResolvedValue({ data: {} });
		await updateCredentials({
			idPlugin: 'tcb',
			login: 'user',
			password: 'secret'
		});
		expect(mockPost).toHaveBeenCalledWith('/mangas/adm/credentials', {
			idPlugin: 'tcb',
			login: 'user',
			password: 'secret'
		});
	});
});

describe('updateMangasByPlugin', () => {
	it('calls GET /mangas/adm/update-mangas with idPlugin param', async () => {
		mockGet.mockResolvedValue({ data: {} });
		await updateMangasByPlugin('tcb');
		expect(mockGet).toHaveBeenCalledWith('/mangas/adm/update-mangas', {
			params: { idPlugin: 'tcb' }
		});
	});
});

describe('fetchMangaList', () => {
	it('calls GET /mangas/adm', async () => {
		mockGet.mockResolvedValue({ data: [] });
		const result = await fetchMangaList();
		expect(mockGet).toHaveBeenCalledWith('/mangas/adm');
		expect(result).toEqual([]);
	});
});

describe('deleteManga', () => {
	it('calls DELETE /mangas/adm/:idManga', async () => {
		mockDelete.mockResolvedValue({ data: {} });
		await deleteManga(42);
		expect(mockDelete).toHaveBeenCalledWith('/mangas/adm/42');
	});
});

describe('fetchMangasByPlugin', () => {
	it('calls GET /mangas/:idPlugin', async () => {
		mockGet.mockResolvedValue({ data: [] });
		await fetchMangasByPlugin('tcb');
		expect(mockGet).toHaveBeenCalledWith('/mangas/tcb');
	});
});

describe('addManga', () => {
	it('calls POST /mangas/adm with title only and returns idManga', async () => {
		mockPost.mockResolvedValue({ data: { idManga: 7 } });
		const result = await addManga({ title: 'Naruto' });
		expect(mockPost).toHaveBeenCalledWith('/mangas/adm', { title: 'Naruto' });
		expect(result).toEqual({ idManga: 7 });
	});
});

describe('linkConnector', () => {
	it('calls POST /mangas/adm/:idManga/connectors with payload', async () => {
		mockPost.mockResolvedValue({ data: {} });
		await linkConnector(7, {
			idPlugin: 'tcb',
			idMangaPlugin: 'abc',
			titlePlugin: 'Naruto'
		});
		expect(mockPost).toHaveBeenCalledWith('/mangas/adm/7/connectors', {
			idPlugin: 'tcb',
			idMangaPlugin: 'abc',
			titlePlugin: 'Naruto'
		});
	});
});
