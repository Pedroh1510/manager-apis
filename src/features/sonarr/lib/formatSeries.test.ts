import { describe, expect, it } from 'vitest';
import { episodeStateLabel, formatBytes, formatEpisodeCode, healthTypeLabel, initialsOf, seriesStatusLabel } from './formatSeries';

describe('formatSeries', () => {
	it('formats bytes in GB from 1 GiB and MB below', () => {
		expect(formatBytes(53687091200)).toBe('50.0 GB');
		expect(formatBytes(1610612736)).toBe('1.5 GB');
		expect(formatBytes(524288000)).toBe('500 MB');
		expect(formatBytes(0)).toBe('0 MB');
	});

	it('formats the episode code with two digits', () => {
		expect(formatEpisodeCode(1, 3)).toBe('S01E03');
		expect(formatEpisodeCode(12, 104)).toBe('S12E104');
		expect(formatEpisodeCode(0, 1)).toBe('S00E01');
	});

	it('labels series status, episode state and health type', () => {
		expect(['continuing', 'ended', 'upcoming', 'deleted'].map(seriesStatusLabel)).toEqual(['Continuando', 'Encerrada', 'Em breve', 'deleted']);
		expect((['downloaded', 'missing', 'unaired', 'tba'] as const).map(episodeStateLabel)).toEqual(['Baixado', 'Faltando', 'Não exibido', 'Sem data']);
		expect(['warning', 'error', 'notice'].map(healthTypeLabel)).toEqual(['Aviso', 'Erro', 'notice']);
	});

	it('takes the initials of the first two words', () => {
		expect(initialsOf('Ação Total')).toBe('AT');
		expect(initialsOf('The Wire')).toBe('TW');
		expect(initialsOf('Dark')).toBe('D');
	});
});
