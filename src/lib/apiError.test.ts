import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './apiError';

describe('getApiErrorMessage', () => {
	it('reads the error field the server answers with', () => {
		const error = { isAxiosError: true, response: { status: 502, data: { error: 'qBittorrent indisponível' } } };
		expect(getApiErrorMessage(error)).toBe('qBittorrent indisponível');
	});

	it('still reads the message field of the other APIs', () => {
		expect(getApiErrorMessage({ response: { data: { message: 'Manga 1 not found' } } })).toBe('Manga 1 not found');
	});
});
