import type { AddOptions, MonitorOption } from '../services/types';
import { MONITOR_OPTIONS } from './seriesType';

/** The slice of Web Storage this module uses, so tests pass an in-memory one. */
export interface PrefsStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

export interface AddSeriesPrefs {
	qualityProfileId: number;
	rootFolderPath: string;
	monitor: MonitorOption;
	searchForMissingEpisodes: boolean;
}

export const ADD_SERIES_PREFS_KEY = 'sonarr.addSeries.prefs';

const isMonitorOption = (value: unknown): value is MonitorOption => MONITOR_OPTIONS.some((option) => option.value === value);

function isAddSeriesPrefs(value: unknown): value is AddSeriesPrefs {
	const prefs = value as Partial<AddSeriesPrefs> | null;
	return typeof prefs?.qualityProfileId === 'number' && typeof prefs.rootFolderPath === 'string'
		&& isMonitorOption(prefs.monitor) && typeof prefs.searchForMissingEpisodes === 'boolean';
}

/** Private windows and blocked site data make localStorage throw; then nothing is remembered. */
export function browserPrefsStorage(): PrefsStorage | null {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

/**
 * The last choices, or null when nothing valid was saved or storage is unavailable.
 * @example readAddSeriesPrefs(browserPrefsStorage())
 */
export function readAddSeriesPrefs(storage: PrefsStorage | null): AddSeriesPrefs | null {
	try {
		const parsed: unknown = JSON.parse(storage?.getItem(ADD_SERIES_PREFS_KEY) ?? 'null');
		return isAddSeriesPrefs(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

/** Best effort: a full or blocked storage only means the next form starts from the defaults. */
export function writeAddSeriesPrefs(storage: PrefsStorage | null, prefs: AddSeriesPrefs): void {
	try {
		storage?.setItem(ADD_SERIES_PREFS_KEY, JSON.stringify(prefs));
	} catch {
		// nothing to do: the defaults apply next time
	}
}

/**
 * Form start values: saved choices that still exist in Sonarr, else the first option (decision A3).
 * @example resolveAddSeriesDefaults(null, options).monitor // 'all'
 */
export function resolveAddSeriesDefaults(prefs: AddSeriesPrefs | null, options: AddOptions): AddSeriesPrefs {
	const hasProfile = options.qualityProfiles.some((profile) => profile.id === prefs?.qualityProfileId);
	const hasFolder = options.rootFolders.some((folder) => folder.path === prefs?.rootFolderPath);
	return {
		qualityProfileId: hasProfile && prefs ? prefs.qualityProfileId : (options.qualityProfiles[0]?.id ?? 0),
		rootFolderPath: hasFolder && prefs ? prefs.rootFolderPath : (options.rootFolders[0]?.path ?? ''),
		monitor: prefs?.monitor ?? 'all',
		searchForMissingEpisodes: prefs?.searchForMissingEpisodes ?? true
	};
}
