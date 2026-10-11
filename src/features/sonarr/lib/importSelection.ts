import type { EpisodeRef, ImportCandidate, ImportChoice } from '../services/types';
import { formatEpisodeCode } from './formatSeries';

/** What the admin set for one file of the download. */
export interface FileSelection {
	isChecked: boolean;
	seriesId: number | null;
	episodes: EpisodeRef[];
}

export type ImportSelection = Record<string, FileSelection>;

const isComplete = (file: FileSelection) => file.seriesId !== null && file.episodes.length > 0;

/**
 * Starts from Sonarr's detection; a file is pre-checked only when it is ready to import.
 * @example initialSelection(candidates)['/dl/a.mkv'].isChecked
 */
export function initialSelection(candidates: ImportCandidate[]): ImportSelection {
	const entries = candidates.map((candidate): [string, FileSelection] => {
		const file = { isChecked: false, seriesId: candidate.seriesId, episodes: candidate.episodes };
		return [candidate.path, { ...file, isChecked: isComplete(file) }];
	});
	return Object.fromEntries(entries);
}

/** @example checkedFiles(selection).length // what "Importar (n)" counts */
export function checkedFiles(selection: ImportSelection): [string, FileSelection][] {
	return Object.entries(selection).filter(([, file]) => file.isChecked);
}

/**
 * True when something is checked and every checked file has a series and episodes (AC 14).
 * @example canImport(selection)
 */
export function canImport(selection: ImportSelection): boolean {
	const checked = checkedFiles(selection);
	return checked.length > 0 && checked.every(([, file]) => isComplete(file));
}

/** @example toImportChoices(selection) // [{ path, seriesId, episodeIds }] */
export function toImportChoices(selection: ImportSelection): ImportChoice[] {
	return checkedFiles(selection).map(([path, file]) => ({ path, seriesId: file.seriesId ?? 0, episodeIds: file.episodes.map((episode) => episode.id) }));
}

/** @example formatEpisodeList([s2e7, s2e8]) // 'S02E07, S02E08' */
export function formatEpisodeList(episodes: EpisodeRef[]): string {
	if (episodes.length === 0) return 'Nenhum';
	return episodes.map((episode) => formatEpisodeCode(episode.seasonNumber, episode.episodeNumber)).join(', ');
}
