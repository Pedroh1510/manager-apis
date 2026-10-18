import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders';
import type { Weekday } from '../services/types';
import { seasonItem } from '../test/fixtures';
import { AnimeSeasonCard } from './AnimeSeasonCard';

const renderCard = (item = seasonItem(), { isUpcoming = false, isSonarrOn = true } = {}) =>
	renderWithProviders(<AnimeSeasonCard item={item} isUpcoming={isUpcoming} isSonarrOn={isSonarrOn} />);

describe('AnimeSeasonCard', () => {
	it('card shows the season fields', () => {
		const { unmount } = renderCard();
		const cover = screen.getByRole('img', { name: 'Sousou no Frieren' });
		expect(cover).toHaveAttribute('loading', 'lazy');
		for (const text of ['Sousou no Frieren', "Frieren: Beyond Journey's End", '8,7', '120 mil', '28 ep.', 'Madhouse', 'Adventure', 'Drama', 'Fantasy', 'Sáb 23:00 JST']) {
			expect(screen.getByText(text)).toBeInTheDocument();
		}
		expect(screen.getByText(/Em exibição/)).toBeInTheDocument();
		unmount();

		const sameTitle = renderCard(seasonItem({ titleEnglish: 'Sousou no Frieren', score: null, episodes: null, status: 'notYetAired' }));
		expect(screen.getAllByText('Sousou no Frieren')).toHaveLength(1);
		expect(screen.getByText('Sem score')).toBeInTheDocument();
		expect(screen.getByText('? ep.')).toBeInTheDocument();
		expect(screen.getByText(/Ainda não exibido/)).toBeInTheDocument();
		sameTitle.unmount();

		const finished = renderCard(seasonItem({ status: 'finished' }));
		expect(screen.getByText(/Finalizado/)).toBeInTheDocument();
		finished.unmount();

		const days: Record<Weekday, string> = { monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui', friday: 'Sex', saturday: 'Sáb', sunday: 'Dom' };
		for (const [day, label] of Object.entries(days) as [Weekday, string][]) {
			const card = renderCard(seasonItem({ broadcast: { day, time: '01:30' } }));
			expect(screen.getByText(`${label} 01:30 JST`)).toBeInTheDocument();
			card.unmount();
		}
	});

	it('upcoming card shows the premiere date', () => {
		const dated = renderCard(seasonItem({ airedFrom: '2027-01-09T00:00:00+00:00' }), { isUpcoming: true });
		expect(screen.getByText('Estreia 09/01/2027')).toBeInTheDocument();
		expect(screen.queryByText('Sáb 23:00 JST')).not.toBeInTheDocument();
		dated.unmount();

		renderCard(seasonItem({ airedFrom: null }), { isUpcoming: true });
		expect(screen.getByText('Sem data')).toBeInTheDocument();
	});

	it('synopsis expands in the card', () => {
		const withText = renderCard();
		const toggle = screen.getByRole('button', { name: 'Sinopse' });
		expect(screen.queryByText('During their decade-long quest to defeat the Demon King...')).not.toBeInTheDocument();
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByText('During their decade-long quest to defeat the Demon King...')).toBeInTheDocument();
		withText.unmount();

		renderCard(seasonItem({ synopsis: null }));
		fireEvent.click(screen.getByRole('button', { name: 'Sinopse' }));
		expect(screen.getByText('Sem sinopse')).toBeInTheDocument();
	});

	it('mal link opens in a new tab', () => {
		renderCard();
		const link = screen.getByRole('link', { name: 'MAL' });
		expect(link).toHaveAttribute('href', 'https://myanimelist.net/anime/52991/Sousou_no_Frieren');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('sonarr link uses the english title and needs sonarr', () => {
		const english = renderCard();
		expect(screen.getByRole('link', { name: 'Adicionar no Sonarr' })).toHaveAttribute('href', "/sonarr/adicionar?q=Frieren%3A%20Beyond%20Journey's%20End");
		english.unmount();

		const romaji = renderCard(seasonItem({ titleEnglish: null }));
		expect(screen.getByRole('link', { name: 'Adicionar no Sonarr' })).toHaveAttribute('href', '/sonarr/adicionar?q=Sousou%20no%20Frieren');
		romaji.unmount();

		renderCard(seasonItem(), { isSonarrOn: false });
		expect(screen.queryByRole('link', { name: 'Adicionar no Sonarr' })).not.toBeInTheDocument();
	});
});
