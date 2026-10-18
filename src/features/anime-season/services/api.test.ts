import { beforeEach, describe, expect, it, vi } from 'vitest';
import { serverHttp } from '../../../lib/http';
import { fetchAnimeSeason, fetchUpcomingAnime } from './api';

vi.mock('../../../lib/http', () => ({ serverHttp: { get: vi.fn() } }));

beforeEach(() => {
	vi.mocked(serverHttp.get).mockReset();
	vi.mocked(serverHttp.get).mockResolvedValue({ data: { items: [], truncated: false } });
});

describe('anime season api', () => {
	it('season request uses the season route with the type param', async () => {
		await fetchAnimeSeason(2026, 'fall', 'tv');
		await fetchAnimeSeason(2027, 'winter', 'special');
		expect(vi.mocked(serverHttp.get).mock.calls).toEqual([
			['/anime/seasons/2026/fall', { params: { type: 'tv' } }],
			['/anime/seasons/2027/winter', { params: { type: 'special' } }]
		]);
	});

	it('upcoming request uses the upcoming route with the type param', async () => {
		await fetchUpcomingAnime('ona');
		expect(vi.mocked(serverHttp.get)).toHaveBeenCalledWith('/anime/seasons/upcoming', { params: { type: 'ona' } });
	});
});
