import { useSearchParams } from 'react-router-dom';
import { isSeriesSort, type SeriesSort } from '../lib/sortSeries';

export type StatusFilter = 'all' | 'continuing' | 'ended' | 'upcoming';

const STATUS_FILTERS: StatusFilter[] = ['continuing', 'ended', 'upcoming'];

export interface LibraryParams {
	query: string;
	status: StatusFilter;
	sort: SeriesSort;
}

/**
 * Library state lives in the URL (`?q=&status=&sort=`), like the mangas list; defaults stay out of it.
 * @example const { params, setParam } = useLibraryParams()
 */
export function useLibraryParams() {
	const [search, setSearch] = useSearchParams();
	const rawStatus = search.get('status');
	const rawSort = search.get('sort');
	const params: LibraryParams = {
		query: search.get('q') ?? '',
		status: STATUS_FILTERS.find((status) => status === rawStatus) ?? 'all',
		sort: isSeriesSort(rawSort) ? rawSort : 'title'
	};

	function setParam(key: 'q' | 'status' | 'sort', value: string, defaultValue = '') {
		setSearch((current) => {
			const next = new URLSearchParams(current);
			if (value && value !== defaultValue) next.set(key, value);
			else next.delete(key);
			return next;
		}, { replace: true });
	}

	return { params, setParam };
}
