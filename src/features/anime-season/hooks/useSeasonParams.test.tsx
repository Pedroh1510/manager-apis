import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { useSeasonParams } from './useSeasonParams';

function ParamsProbe() {
	const { params, updateParams } = useSeasonParams();
	return (
		<>
			<output>{`${params.year} ${params.season} ${params.type} ${params.sort} ${params.tab}`}</output>
			<button onClick={() => updateParams({ type: 'movie' })}>filme</button>
			<button onClick={() => updateParams({ type: 'tv', year: 2026, season: 'fall' })}>padrão</button>
		</>
	);
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 9, 18, 12));
});

afterEach(() => vi.useRealTimers());

describe('useSeasonParams', () => {
	it('default values stay out of the url', () => {
		renderWithProviders(<ParamsProbe />, { route: '/anime/temporadas?ano=2025&estacao=verao' });
		expect(screen.getByRole('status')).toHaveTextContent('2025 summer tv popularity season');

		fireEvent.click(screen.getByRole('button', { name: 'filme' }));
		expect(screen.getByTestId('location')).toHaveTextContent('/anime/temporadas?ano=2025&estacao=verao&tipo=filme');

		fireEvent.click(screen.getByRole('button', { name: 'padrão' }));
		expect(screen.getByTestId('location').textContent).toBe('/anime/temporadas');
	});
});
