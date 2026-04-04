import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rssHttp } from '../../../lib/http';
import {
	fetchAnimeStatus,
	fetchRss,
	fetchTorrents,
	fetchConcludedTorrents,
	stopTorrent,
	deleteTorrent,
	deleteAllTorrents
} from './api';

vi.mock('../../../lib/http', () => ({
	rssHttp: {
		get: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn()
	}
}));

const mockGet = vi.mocked(rssHttp.get);
const mockPatch = vi.mocked(rssHttp.patch);
const mockDelete = vi.mocked(rssHttp.delete);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('fetchAnimeStatus', () => {
	it('calls GET /status and returns data', async () => {
		mockGet.mockResolvedValue({ data: { status: 'ok' } });
		const result = await fetchAnimeStatus();
		expect(mockGet).toHaveBeenCalledWith('/status');
		expect(result).toEqual({ status: 'ok' });
	});
});

describe('fetchRss', () => {
	it('calls GET /rss/json with default params', async () => {
		mockGet.mockResolvedValue({ data: [] });
		await fetchRss({});
		expect(mockGet).toHaveBeenCalledWith('/rss/json', { params: {} });
	});

	it('includes scanAllItems param when true', async () => {
		mockGet.mockResolvedValue({ data: [] });
		await fetchRss({ scanAllItems: true });
		expect(mockGet).toHaveBeenCalledWith('/rss/json', {
			params: { scanAllItems: true }
		});
	});

	it('includes search params when provided', async () => {
		mockGet.mockResolvedValue({ data: [] });
		await fetchRss({ q: 'naruto', term: 'ep1' });
		expect(mockGet).toHaveBeenCalledWith('/rss/json', {
			params: { q: 'naruto', term: 'ep1' }
		});
	});
});

describe('fetchTorrents', () => {
	it('calls GET /adm/torrents', async () => {
		mockGet.mockResolvedValue({ data: [] });
		const result = await fetchTorrents();
		expect(mockGet).toHaveBeenCalledWith('/adm/torrents');
		expect(result).toEqual([]);
	});
});

describe('fetchConcludedTorrents', () => {
	it('calls GET /adm/torrents/concluded', async () => {
		mockGet.mockResolvedValue({ data: [] });
		await fetchConcludedTorrents();
		expect(mockGet).toHaveBeenCalledWith('/adm/torrents/concluded');
	});
});

describe('stopTorrent', () => {
	it('calls PATCH /adm/torrents/{hash}/stop', async () => {
		mockPatch.mockResolvedValue({ data: {} });
		await stopTorrent('abc123');
		expect(mockPatch).toHaveBeenCalledWith('/adm/torrents/abc123/stop');
	});
});

describe('deleteTorrent', () => {
	it('calls DELETE /adm/torrents/{hash}', async () => {
		mockDelete.mockResolvedValue({ data: {} });
		await deleteTorrent('abc123');
		expect(mockDelete).toHaveBeenCalledWith('/adm/torrents/abc123');
	});
});

describe('deleteAllTorrents', () => {
	it('calls GET /adm/delete', async () => {
		mockGet.mockResolvedValue({ data: {} });
		await deleteAllTorrents();
		expect(mockGet).toHaveBeenCalledWith('/adm/delete');
	});
});
