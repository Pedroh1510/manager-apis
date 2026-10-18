import { useSearchParams } from 'react-router-dom';
import { parseSeasonParams, seasonParamsToSearch, type SeasonParams } from '../lib/seasonParams';

export interface SeasonParamsState {
	params: SeasonParams;
	/** Merges `patch` and rewrites the URL without the defaults. */
	updateParams: (patch: Partial<SeasonParams>) => void;
}

/**
 * Season screen state lives in the URL (door 5); the adult toggle and the search do not.
 * @example const { params, updateParams } = useSeasonParams(); updateParams({ type: 'ona' })
 */
export function useSeasonParams(): SeasonParamsState {
	const [search, setSearch] = useSearchParams();
	const today = new Date();
	const params = parseSeasonParams(search, today);
	return {
		params,
		updateParams: (patch) => setSearch(seasonParamsToSearch({ ...params, ...patch }, today), { replace: true })
	};
}
