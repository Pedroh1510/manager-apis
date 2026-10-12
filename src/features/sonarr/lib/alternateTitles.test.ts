import { describe, expect, it } from 'vitest';
import { formatSeasonSuffix } from './alternateTitles';

describe('formatSeasonSuffix', () => {
	it('season suffix collapses consecutive seasons', () => {
		expect(formatSeasonSuffix([])).toBe('');
		expect(formatSeasonSuffix([1])).toBe(' (T1)');
		expect(formatSeasonSuffix([1, 3])).toBe(' (T1, T3)');
		expect(formatSeasonSuffix([1, 2, 3])).toBe(' (T1–T3)');
		expect(formatSeasonSuffix([1, 2, 3, 5])).toBe(' (T1–T3, T5)');
	});
});
