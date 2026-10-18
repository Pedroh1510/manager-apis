import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mangasHttp } from '../../../lib/http';
import {
	fetchMangasStatus,
	fetchPlugins,
	updateCookie,
	updateCredentials,
	searchAllChapters,
	refreshPluginCatalog,
	fetchMangaList,
	deleteManga,
	fetchMangasByPlugin,
	addManga,
	linkConnector,
	setAllConnectorsActive,
	setConnectorActive,
	fetchChapters,
	fetchMissingChapters,
	fetchChapterPages,
	deleteChapter,
	fetchCoverSuggestions,
	acceptCoverSuggestion,
	dismissCoverSuggestion
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
const mockPatch = vi.mocked(mangasHttp.patch);

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

describe('searchAllChapters', () => {
	it('calls GET /mangas/adm/update-mangas without idPlugin so every connector is searched', async () => {
		mockGet.mockResolvedValue({ data: {} });
		await searchAllChapters();
		expect(mockGet).toHaveBeenCalledWith('/mangas/adm/update-mangas');
	});
});

describe('refreshPluginCatalog', () => {
	it('calls POST /mangas/adm/catalog/:idPlugin/refresh', async () => {
		mockPost.mockResolvedValue({ data: { idPlugin: 'nexustoons' } });
		await refreshPluginCatalog('nexustoons');
		expect(mockPost).toHaveBeenCalledWith('/mangas/adm/catalog/nexustoons/refresh');
	});

	it('encodes the plugin id in the path', async () => {
		mockPost.mockResolvedValue({ data: {} });
		await refreshPluginCatalog('a/b');
		expect(mockPost).toHaveBeenCalledWith('/mangas/adm/catalog/a%2Fb/refresh');
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

	it('returns null when the catalog is still downloading', async () => {
		mockGet.mockResolvedValue({ status: 202, data: '' });
		expect(await fetchMangasByPlugin('tcb')).toBeNull();
	});

	it('returns the list when the catalog is ready', async () => {
		mockGet.mockResolvedValue({
			status: 200,
			data: [{ id: '1', title: 'Black Clover' }]
		});
		expect(await fetchMangasByPlugin('tcb')).toEqual([
			{ id: '1', title: 'Black Clover' }
		]);
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

describe('connector activation endpoints', () => {
	it('PATCHes every link or a single one', async () => {
		mockPatch.mockResolvedValue({ data: {} });

		await setAllConnectorsActive(7, true);
		await setConnectorActive(7, 'mangeek', false);

		expect(mockPatch).toHaveBeenNthCalledWith(1, '/mangas/adm/7/connectors', { isActive: true });
		expect(mockPatch).toHaveBeenNthCalledWith(2, '/mangas/adm/7/connectors/mangeek', { isActive: false });
	});
});

describe('fetchMangaList keeps the connectors array', () => {
	it('returns connectors as the API sent them', async () => {
		const connectors = [{ idMangaConnector: 3, idPlugin: 'tcb', titlePlugin: 'Naruto', isActive: true }];
		mockGet.mockResolvedValue({ data: [{ idManga: 1, title: 'Naruto', createdAt: '', updatedAt: '', connectors }] });

		const [first] = await fetchMangaList();

		expect(first.connectors).toEqual(connectors);
	});
});

describe('chapter endpoints', () => {
	it('call the chapter routes of a manga', async () => {
		mockGet.mockResolvedValue({ data: [] });
		mockDelete.mockResolvedValue({ data: undefined });

		await fetchChapters(1);
		await fetchMissingChapters(1);
		await fetchChapterPages(1, 5);
		await deleteChapter(1, 5);

		expect(mockGet.mock.calls.map(([url]) => url)).toEqual([
			'/mangas/adm/1/chapters',
			'/mangas/adm/1/chapters/missing',
			'/mangas/adm/1/chapters/5/pages'
		]);
		expect(mockDelete).toHaveBeenCalledWith('/mangas/adm/1/chapters/5');
	});
});

describe('cover suggestions', () => {
	it('fetchCoverSuggestions calls GET /mangas/adm/suggestions', async () => {
		const body = { suggestions: [], conflicts: [] };
		mockGet.mockResolvedValue({ data: body });

		await expect(fetchCoverSuggestions()).resolves.toEqual(body);
		expect(mockGet).toHaveBeenCalledWith('/mangas/adm/suggestions');
	});

	it('acceptCoverSuggestion calls POST /mangas/adm/suggestions/:id/accept', async () => {
		mockPost.mockResolvedValue({ data: {} });

		await acceptCoverSuggestion(3);
		expect(mockPost).toHaveBeenCalledWith('/mangas/adm/suggestions/3/accept');
	});

	it('dismissCoverSuggestion calls POST /mangas/adm/suggestions/:id/dismiss', async () => {
		mockPost.mockResolvedValue({ data: {} });

		await dismissCoverSuggestion(4);
		expect(mockPost).toHaveBeenCalledWith('/mangas/adm/suggestions/4/dismiss');
	});
});
