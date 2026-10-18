import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as configApi from '../../server-config/services/api';
import { renderWithProviders } from '../../../test/renderWithProviders';
import * as api from '../services/api';
import { seasonItem, seasonList } from '../test/fixtures';
import { AnimeSeasonPage } from './AnimeSeasonPage';

vi.mock('../services/api');
vi.mock('../../server-config/services/api');

const httpError = (status: number, error: string) => ({ isAxiosError: true, response: { status, data: { error } }, message: 'x' });
const renderPage = (route = '/anime/temporadas') => renderWithProviders(<AnimeSeasonPage />, { route });
const cardTitles = () => screen.getAllByTestId('season-card').map((card) => within(card).getByRole('heading', { level: 3 }).textContent);
const location = () => screen.getByTestId('location').textContent;

const ITEMS = [
	seasonItem({ malId: 1, title: 'Sousou no Frieren', members: 900, score: 8.7, broadcast: { day: 'friday', time: '23:00' } }),
	seasonItem({ malId: 2, title: 'Dandadan', titleEnglish: null, members: 500, score: 9.1, broadcast: { day: 'thursday', time: '00:30' } }),
	seasonItem({ malId: 3, title: 'Kusuriya no Hitorigoto', titleEnglish: 'The Apothecary Diaries', members: 700, score: null, broadcast: null })
];

beforeEach(() => {
	vi.resetAllMocks();
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 9, 18, 12));
	vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: true, sonarrUpload: false, tdarr: false, jikan: true });
	vi.mocked(api.fetchAnimeSeason).mockResolvedValue(seasonList(ITEMS));
	vi.mocked(api.fetchUpcomingAnime).mockResolvedValue(seasonList(ITEMS));
});

afterEach(() => vi.useRealTimers());

describe('AnimeSeasonPage', () => {
	it('opens on the current season', async () => {
		renderPage();
		expect(await screen.findByRole('heading', { name: 'Outono 2026', level: 1 })).toBeInTheDocument();
		await screen.findAllByTestId('season-card');
		expect(api.fetchAnimeSeason).toHaveBeenCalledWith(2026, 'fall', 'tv');
		expect(cardTitles()).toEqual(['Sousou no Frieren', 'Kusuriya no Hitorigoto', 'Dandadan']);
	});

	it('arrows and selector navigate seasons', async () => {
		renderPage();
		await screen.findAllByTestId('season-card');
		fireEvent.click(screen.getByRole('button', { name: 'Próxima temporada' }));
		expect(location()).toBe('/anime/temporadas?ano=2027&estacao=inverno');
		expect(await screen.findByRole('heading', { name: 'Inverno 2027', level: 1 })).toBeInTheDocument();
		expect(api.fetchAnimeSeason).toHaveBeenLastCalledWith(2027, 'winter', 'tv');

		fireEvent.click(screen.getByRole('button', { name: 'Temporada anterior' }));
		fireEvent.click(screen.getByRole('button', { name: 'Temporada anterior' }));
		expect(location()).toBe('/anime/temporadas?ano=2026&estacao=verao');

		const years = within(screen.getByRole('combobox', { name: 'Ano' })).getAllByRole('option').map((option) => option.textContent);
		expect([years[0], years.at(-1), years.length]).toEqual(['2027', '1917', 111]);
		fireEvent.change(screen.getByRole('combobox', { name: 'Ano' }), { target: { value: '1998' } });
		fireEvent.change(screen.getByRole('combobox', { name: 'Estação' }), { target: { value: 'spring' } });
		expect(location()).toBe('/anime/temporadas?ano=1998&estacao=primavera');
	});

	it('next season is disabled at fall of next year and previous before winter 1917', async () => {
		const last = renderPage('/anime/temporadas?ano=2027&estacao=outono');
		expect(await screen.findByRole('button', { name: 'Próxima temporada' })).toBeDisabled();
		last.unmount();
		renderPage('/anime/temporadas?ano=1917&estacao=inverno');
		expect(await screen.findByRole('button', { name: 'Temporada anterior' })).toBeDisabled();
	});

	it('type chips request each jikan type', async () => {
		renderPage();
		await screen.findAllByTestId('season-card');
		const chips = { TV: 'tv', ONA: 'ona', Filme: 'movie', OVA: 'ova', Especial: 'special' };
		for (const [label, type] of Object.entries(chips)) {
			fireEvent.click(screen.getByRole('button', { name: label }));
			await screen.findAllByTestId('season-card');
			expect(api.fetchAnimeSeason).toHaveBeenLastCalledWith(2026, 'fall', type);
			const pressed = within(screen.getByRole('group', { name: 'Tipo' })).getAllByRole('button').filter((chip) => chip.getAttribute('aria-pressed') === 'true');
			expect(pressed.map((chip) => chip.textContent)).toEqual([label]);
		}
	});

	it('upcoming tab hides season and sort controls', async () => {
		renderPage('/anime/temporadas?aba=anunciados&ordem=score');
		await screen.findAllByTestId('season-card');
		expect(api.fetchUpcomingAnime).toHaveBeenCalledWith('tv');
		expect(api.fetchAnimeSeason).not.toHaveBeenCalled();
		expect(screen.getByRole('heading', { name: 'Anunciados', level: 1 })).toBeInTheDocument();
		for (const name of ['Temporada anterior', 'Próxima temporada']) expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
		for (const name of ['Ano', 'Estação', 'Ordenar por']) expect(screen.queryByRole('combobox', { name })).not.toBeInTheDocument();
		expect(cardTitles()).toEqual(['Sousou no Frieren', 'Kusuriya no Hitorigoto', 'Dandadan']);
	});

	it('weekday sort groups by day', async () => {
		renderPage('/anime/temporadas?ordem=dia');
		await screen.findAllByTestId('season-card');
		const blocks = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
		expect(blocks).toEqual(['Quinta', 'Sexta', 'Sem dia definido']);
		expect(cardTitles()).toEqual(['Dandadan', 'Sousou no Frieren', 'Kusuriya no Hitorigoto']);
	});

	it('weekday blocks are labelled monday to sunday', async () => {
		const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
		const items = days.map((day, index) => seasonItem({ malId: index + 1, title: `Anime ${day}`, broadcast: { day, time: '20:00' } }));
		vi.mocked(api.fetchAnimeSeason).mockResolvedValue(seasonList([...items, seasonItem({ malId: 99, broadcast: null })]));
		renderPage('/anime/temporadas?ordem=dia');
		await screen.findAllByTestId('season-card');
		const blocks = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
		expect(blocks).toEqual(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Sem dia definido']);
	});

	it('sonarr link follows the sonarr flag of the server config', async () => {
		const on = renderPage();
		await screen.findAllByTestId('season-card');
		expect(await screen.findAllByRole('link', { name: 'Adicionar no Sonarr' })).toHaveLength(3);
		on.unmount();

		vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: false, sonarrUpload: false, tdarr: false, jikan: true });
		renderPage();
		await screen.findAllByTestId('season-card');
		await waitFor(() => expect(configApi.fetchServerConfig).toHaveBeenCalledTimes(2));
		expect(screen.queryByRole('link', { name: 'Adicionar no Sonarr' })).not.toBeInTheDocument();
	});

	it('search filters without refetching', async () => {
		renderPage();
		await screen.findAllByTestId('season-card');
		const calls = vi.mocked(api.fetchAnimeSeason).mock.calls.length;
		fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar anime' }), { target: { value: 'apothecary' } });
		expect(cardTitles()).toEqual(['Kusuriya no Hitorigoto']);
		expect(vi.mocked(api.fetchAnimeSeason).mock.calls.length).toBe(calls);
	});

	it('adult toggle starts off and is not persisted', async () => {
		const setItem = vi.spyOn(Storage.prototype, 'setItem');
		vi.mocked(api.fetchAnimeSeason).mockResolvedValue(seasonList([...ITEMS.slice(0, 2), seasonItem({ malId: 9, title: 'Adulto', isAdult: true })]));
		const first = renderPage();
		await screen.findAllByTestId('season-card');
		expect(cardTitles()).toHaveLength(2);
		const toggle = screen.getByRole('switch', { name: 'Mostrar conteúdo adulto' });
		expect(toggle).toHaveAttribute('aria-checked', 'false');
		fireEvent.click(toggle);
		expect(cardTitles()).toHaveLength(3);
		expect(location()).toBe('/anime/temporadas');
		expect(setItem).not.toHaveBeenCalled();
		first.unmount();

		renderPage();
		await screen.findAllByTestId('season-card');
		expect(cardTitles()).toHaveLength(2);
		setItem.mockRestore();
	});

	it('shows 12 skeleton cards while loading', async () => {
		vi.mocked(api.fetchAnimeSeason).mockReturnValue(new Promise(() => undefined));
		renderPage();
		expect(await screen.findAllByTestId('season-card-skeleton')).toHaveLength(12);
		expect(screen.queryByTestId('season-card')).not.toBeInTheDocument();
	});

	it('error shows the message and retries', async () => {
		vi.mocked(api.fetchAnimeSeason).mockRejectedValueOnce(httpError(502, 'falha no Jikan: fall 2026 (HTTP 500)'));
		renderPage();
		expect(await screen.findByText(/falha no Jikan: fall 2026 \(HTTP 500\)/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
		expect(await screen.findAllByTestId('season-card')).toHaveLength(3);
		expect(api.fetchAnimeSeason).toHaveBeenCalledTimes(2);
	});

	it('empty states', async () => {
		vi.mocked(api.fetchAnimeSeason).mockResolvedValueOnce(seasonList([]));
		const empty = renderPage();
		expect(await screen.findByText('Nenhum anime nesta temporada')).toBeInTheDocument();
		empty.unmount();

		const searched = renderPage();
		await screen.findAllByTestId('season-card');
		fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar anime' }), { target: { value: 'naruto' } });
		expect(screen.getByText('Nenhum anime encontrado')).toBeInTheDocument();
		searched.unmount();

		vi.mocked(api.fetchAnimeSeason).mockResolvedValue(seasonList([seasonItem({ isAdult: true })]));
		renderPage();
		expect(await screen.findByText('Nenhum anime encontrado')).toBeInTheDocument();
	});

	it('truncated upcoming shows a notice', async () => {
		const many = Array.from({ length: 500 }, (_, index) => seasonItem({ malId: index + 1, title: `Anime ${index + 1}` }));
		vi.mocked(api.fetchUpcomingAnime).mockResolvedValueOnce(seasonList(many, true));
		const truncated = renderPage('/anime/temporadas?aba=anunciados');
		expect(await screen.findByText('Mostrando os primeiros 500 anunciados')).toBeInTheDocument();
		truncated.unmount();

		renderPage('/anime/temporadas?aba=anunciados');
		await screen.findAllByTestId('season-card');
		expect(screen.queryByText(/Mostrando os primeiros/)).not.toBeInTheDocument();
	});
});
