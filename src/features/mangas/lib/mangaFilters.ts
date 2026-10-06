import { useSearchParams } from 'react-router-dom';
import type { MangaListItem } from '../services/types';
import { deriveMangaStatus, type MangaStatus } from './mangaStatus';

export interface MangaFilters {
	q: string;
	plugin: string;
	status: MangaStatus | '';
}

const STATUSES: ReadonlyArray<MangaStatus> = ['active', 'partial', 'inactive'];
const FILTER_KEYS = ['q', 'plugin', 'status'] as const;

/**
 * Applies the three list filters; an empty filter matches everything.
 * @example filterMangas(mangas, { q: 'naru', plugin: '', status: '' })
 */
export function filterMangas(mangas: MangaListItem[], { q, plugin, status }: MangaFilters): MangaListItem[] {
	const needle = q.trim().toLowerCase();
	return mangas.filter(
		(manga) =>
			(!needle || manga.title.toLowerCase().includes(needle)) &&
			(!plugin || manga.connectors.some((connector) => connector.idPlugin === plugin)) &&
			(!status || deriveMangaStatus(manga.connectors) === status)
	);
}

/**
 * Filters live in the URL (`?q=&plugin=&status=`) so a filtered list survives
 * reloads and can be shared as a link.
 * @example const { filters, setFilter, clearFilters } = useMangaFilters()
 */
export function useMangaFilters() {
	const [params, setParams] = useSearchParams();
	const rawStatus = params.get('status') ?? '';
	const filters: MangaFilters = {
		q: params.get('q') ?? '',
		plugin: params.get('plugin') ?? '',
		status: STATUSES.includes(rawStatus as MangaStatus) ? (rawStatus as MangaStatus) : ''
	};

	function setFilter(key: keyof MangaFilters, value: string) {
		setParams((current) => {
			const next = new URLSearchParams(current);
			if (value) next.set(key, value);
			else next.delete(key);
			return next;
		}, { replace: true });
	}

	function clearFilters() {
		setParams((current) => {
			const next = new URLSearchParams(current);
			FILTER_KEYS.forEach((key) => next.delete(key));
			return next;
		}, { replace: true });
	}

	const hasFilters = FILTER_KEYS.some((key) => filters[key] !== '');
	return { filters, setFilter, clearFilters, hasFilters };
}
