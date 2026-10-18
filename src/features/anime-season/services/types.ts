// Mirrors server/jikan/jikanSeasonItems.ts (door 4).

export type SeasonName = 'winter' | 'spring' | 'summer' | 'fall';
export type AnimeType = 'tv' | 'movie' | 'ova' | 'special' | 'ona';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type AiringStatus = 'airing' | 'notYetAired' | 'finished';

export interface AnimeSeasonItem {
	malId: number;
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
	/** JST, as Jikan gives it. */
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
