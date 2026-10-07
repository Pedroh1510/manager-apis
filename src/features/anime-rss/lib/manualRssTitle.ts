export const VIDEO_FORMATS = ['2160p', '1080p', '720p', '480p'] as const;
export const VIDEO_CODECS = ['x264', 'x265', 'HEVC', 'AV1'] as const;
export const DEFAULT_VIDEO_FORMAT: VideoFormat = '1080p';
// Same cap the API's DTO applies to `title` (POST /rss → 400 above it).
export const MANUAL_TITLE_MAX_LENGTH = 500;

export type VideoFormat = (typeof VIDEO_FORMATS)[number];
export type VideoCodec = (typeof VIDEO_CODECS)[number];

export type ManualRssTitleInput =
	| { kind: 'titleOnly'; title: string }
	| { kind: 'episode'; title: string; season: number; episode: number; format: VideoFormat; codec: VideoCodec | null };

const MANUAL_PREFIX = '[MANUAL]';
// No accent on purpose: keeps the feed ASCII-safe for Sonarr/torznab clients.
const LANGUAGE_TAG = '[portugues]';
const NON_NEGATIVE_INTEGER = /^\d+$/;

/** Sonarr reads `S01E05`; numbers above 99 keep every digit (`E100`). */
function padEpisodeNumber(value: number): string {
	return String(value).padStart(2, '0');
}

/**
 * Builds the feed title for a manually added item.
 * @example formatManualRssTitle({ kind: 'episode', title: 'Frieren', season: 1, episode: 28, format: '1080p', codec: 'x265' })
 * // → '[MANUAL] Frieren S01E28 [1080p] [x265] [portugues]'
 */
export function formatManualRssTitle(input: ManualRssTitleInput): string {
	const title = input.title.trim();
	if (input.kind === 'titleOnly') return `${MANUAL_PREFIX} ${title} ${LANGUAGE_TAG}`;
	const tag = `S${padEpisodeNumber(input.season)}E${padEpisodeNumber(input.episode)}`;
	const codec = input.codec ? ` [${input.codec}]` : '';
	return `${MANUAL_PREFIX} ${title} ${tag} [${input.format}]${codec} ${LANGUAGE_TAG}`;
}

/**
 * Reads a season/episode field: whole number at least `min`, otherwise null.
 * @example parseEpisodeNumber('05', 1) // → 5
 */
export function parseEpisodeNumber(raw: string, min: number): number | null {
	const trimmed = raw.trim();
	if (!NON_NEGATIVE_INTEGER.test(trimmed)) return null;
	const value = Number(trimmed);
	return value >= min ? value : null;
}

/**
 * True when the composed title would be rejected by the API's length cap.
 * @example exceedsTitleLimit('a'.repeat(501)) // → true
 */
export function exceedsTitleLimit(composedTitle: string | null): boolean {
	return composedTitle !== null && composedTitle.length > MANUAL_TITLE_MAX_LENGTH;
}
