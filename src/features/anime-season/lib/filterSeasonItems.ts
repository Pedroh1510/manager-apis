import type { AnimeSeasonItem } from '../services/types';

const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Items whose title or English title contains `search`, ignoring case and accents; blank keeps all.
 * @example filterSeasonItems(items, 'FRIEREN') // matches "Frieren: Beyond Journey's End"
 */
export function filterSeasonItems(items: AnimeSeasonItem[], search: string): AnimeSeasonItem[] {
	const needle = normalize(search.trim());
	if (!needle) return items;
	return items.filter(({ title, titleEnglish }) => normalize(`${title}\n${titleEnglish ?? ''}`).includes(needle));
}
