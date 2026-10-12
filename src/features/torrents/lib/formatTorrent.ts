const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const BYTES_PER_KIB = 1024;
const BYTES_PER_MIB = 1024 * 1024;

/**
 * Coarsest useful unit: hours+minutes, minutes, or seconds; `—` when qBittorrent has no estimate.
 * @example formatEta(5400) // '1h 30min'
 */
export function formatEta(seconds: number | null): string {
	if (seconds === null) return '—';
	if (seconds >= SECONDS_PER_HOUR) {
		const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
		return `${Math.floor(seconds / SECONDS_PER_HOUR)}h ${minutes}min`;
	}
	if (seconds >= SECONDS_PER_MINUTE) return `${Math.floor(seconds / SECONDS_PER_MINUTE)}min`;
	return `${seconds}s`;
}

/**
 * @example formatSpeed(2621440) // '2.5 MB/s'
 */
export function formatSpeed(bytesPerSecond: number): string {
	if (bytesPerSecond >= BYTES_PER_MIB) return `${(bytesPerSecond / BYTES_PER_MIB).toFixed(1)} MB/s`;
	return `${Math.round(bytesPerSecond / BYTES_PER_KIB)} KB/s`;
}

/**
 * @example formatProgress(0.456) // '46%'
 */
export function formatProgress(fraction: number): string {
	return `${Math.round(fraction * 100)}%`;
}
