/** Consecutive seasons become one run, so `[1, 2, 3, 5]` reads as two pieces. */
function toRuns(seasons: number[]): number[][] {
	return seasons.reduce<number[][]>((runs, season) => {
		const last = runs[runs.length - 1];
		if (last && season === last[last.length - 1] + 1) return [...runs.slice(0, -1), [...last, season]];
		return [...runs, [season]];
	}, []);
}

function formatRun(run: number[]): string {
	return run.length === 1 ? `T${run[0]}` : `T${run[0]}–T${run[run.length - 1]}`;
}

/**
 * Season suffix of an alternate title; an empty list means the whole series, so no suffix.
 * @example formatSeasonSuffix([1, 2, 3, 5]) // ' (T1–T3, T5)'
 */
export function formatSeasonSuffix(seasons: number[]): string {
	if (seasons.length === 0) return '';
	return ` (${toRuns(seasons).map(formatRun).join(', ')})`;
}
