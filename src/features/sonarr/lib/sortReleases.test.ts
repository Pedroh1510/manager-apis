import { describe, expect, it } from 'vitest';
import { sortReleases } from './sortReleases';
import type { ReleaseSummary } from '../services/types';

const release = (guid: string, ageHours: number, approved: boolean): ReleaseSummary => ({
	guid, indexerId: 1, title: guid, indexer: 'x', quality: 'q', size: 1, seeders: null, leechers: null, ageHours, approved, rejections: []
});

describe('sortReleases', () => {
	it('sorts by age mixing approved and rejected, stable on ties', () => {
		const received = [release('a30', 30, true), release('r5', 5, false), release('a10', 10, true), release('a5', 5, true)];
		expect(sortReleases(received, 'newest').map((r) => r.guid)).toEqual(['r5', 'a5', 'a10', 'a30']);
		expect(sortReleases(received, 'sonarr')).toBe(received);
		expect(received.map((r) => r.guid)).toEqual(['a30', 'r5', 'a10', 'a5']);
	});
});
