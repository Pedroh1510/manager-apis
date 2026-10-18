import type { AnimeSeasonItem, AnimeSeasonList } from '../services/types';

/**
 * A complete season item; override what the test is about.
 * @example seasonItem({ malId: 2, title: 'Dandadan', score: null })
 */
export function seasonItem(overrides: Partial<AnimeSeasonItem> = {}): AnimeSeasonItem {
	return {
		malId: 52991,
		url: 'https://myanimelist.net/anime/52991/Sousou_no_Frieren',
		imageUrl: 'https://cdn.myanimelist.net/images/anime/1015/138006l.webp',
		title: 'Sousou no Frieren',
		titleEnglish: "Frieren: Beyond Journey's End",
		synopsis: 'During their decade-long quest to defeat the Demon King...',
		type: 'TV',
		episodes: 28,
		score: 8.7,
		scoredBy: 120000,
		members: 450000,
		status: 'airing',
		airedFrom: '2026-10-04T00:00:00+00:00',
		broadcast: { day: 'saturday', time: '23:00' },
		studios: ['Madhouse'],
		genres: ['Adventure', 'Drama', 'Fantasy'],
		isAdult: false,
		...overrides
	};
}

export function seasonList(items: AnimeSeasonItem[], truncated = false): AnimeSeasonList {
	return { items, truncated };
}
