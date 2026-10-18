// Mirrors server/anime/animeSeasonTypes.ts (door 3 of anime-season-anilist).

export type SeasonName = 'winter' | 'spring' | 'summer' | 'fall';
export type AnimeType = 'tv' | 'movie' | 'ova' | 'special' | 'ona';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type AiringStatus = 'airing' | 'notYetAired' | 'finished';

export interface AnimeSeasonItem {
	id: number;
	url: string;
	imageUrl: string | null;
	title: string;
	titleEnglish: string | null;
	synopsis: string | null;
	type: string | null;
	episodes: number | null;
	score: number | null;
	scoredBy: number | null;
	members: number | null;
	status: AiringStatus | null;
	airedFrom: string | null;
	/** JST, Japan's broadcast zone. */
	broadcast: { day: Weekday; time: string } | null;
	studios: string[];
	genres: string[];
	isAdult: boolean;
}

export interface AnimeSeasonList {
	items: AnimeSeasonItem[];
	/** The upcoming list hit the server's page cap. */
	truncated: boolean;
}
