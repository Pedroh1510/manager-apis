import { describe, expect, it } from 'vitest';
import { formatEta, formatProgress, formatSpeed } from './formatTorrent';

describe('formatTorrent', () => {
	it('formats eta by range', () => {
		expect(formatEta(5400)).toBe('1h 30min');
		expect(formatEta(3600)).toBe('1h 0min');
		expect(formatEta(125)).toBe('2min');
		expect(formatEta(59)).toBe('59s');
		expect(formatEta(null)).toBe('—');
	});

	it('formats speed in MB/s from 1 MiB/s and KB/s below', () => {
		expect(formatSpeed(1048576)).toBe('1.0 MB/s');
		expect(formatSpeed(2621440)).toBe('2.5 MB/s');
		expect(formatSpeed(1048575)).toBe('1024 KB/s');
		expect(formatSpeed(51200)).toBe('50 KB/s');
	});

	it('formats progress as a whole percentage', () => {
		expect(formatProgress(0.456)).toBe('46%');
		expect(formatProgress(1)).toBe('100%');
	});
});
