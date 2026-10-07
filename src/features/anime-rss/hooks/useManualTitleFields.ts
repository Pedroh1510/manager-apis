import { useState } from 'react';
import {
	DEFAULT_VIDEO_FORMAT,
	formatManualRssTitle,
	parseEpisodeNumber,
	type ManualRssTitleInput,
	type VideoCodec,
	type VideoFormat
} from '../lib/manualRssTitle';

export interface ManualTitleFieldValues {
	title: string;
	isTitleOnly: boolean;
	season: string;
	episode: string;
	format: VideoFormat;
	codec: VideoCodec | null;
}

export interface ManualTitleFields {
	values: ManualTitleFieldValues;
	/** Title sent to the API, or null while a required field is missing/invalid. */
	composedTitle: string | null;
	update: (patch: Partial<ManualTitleFieldValues>) => void;
	/** Moves to the next episode after a successful add (E05 → 6). */
	advanceEpisode: () => void;
}

const INITIAL_VALUES: ManualTitleFieldValues = {
	title: '',
	isTitleOnly: false,
	season: '',
	episode: '',
	format: DEFAULT_VIDEO_FORMAT,
	codec: null
};

function toTitleInput(values: ManualTitleFieldValues): ManualRssTitleInput | null {
	if (values.title.trim() === '') return null;
	if (values.isTitleOnly) return { kind: 'titleOnly', title: values.title };
	const season = parseEpisodeNumber(values.season, 0);
	const episode = parseEpisodeNumber(values.episode, 1);
	if (season === null || episode === null) return null;
	return { kind: 'episode', title: values.title, season, episode, format: values.format, codec: values.codec };
}

function nextEpisode(raw: string): string {
	const episode = parseEpisodeNumber(raw, 1);
	return episode === null ? '' : String(episode + 1);
}

/**
 * Form state for the structured manual-item title.
 * @example const fields = useManualTitleFields(); fields.update({ season: '1' });
 */
export function useManualTitleFields(): ManualTitleFields {
	const [values, setValues] = useState(INITIAL_VALUES);
	const titleInput = toTitleInput(values);

	return {
		values,
		composedTitle: titleInput ? formatManualRssTitle(titleInput) : null,
		update: (patch) => setValues((current) => ({ ...current, ...patch })),
		advanceEpisode: () => setValues((current) => ({ ...current, episode: nextEpisode(current.episode) }))
	};
}
