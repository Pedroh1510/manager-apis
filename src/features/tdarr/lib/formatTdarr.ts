import { formatDateTime } from '../../../lib/formatDate';
import type { TdarrHardware, TdarrWorkerKind } from '../services/types';

const GB_PER_TB = 1024;
const TWO_DECIMALS = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
const PERCENT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/** @example formatGigabytes(1536) // '1,50 TB' */
export function formatGigabytes(gb: number): string {
	if (gb >= GB_PER_TB) return `${TWO_DECIMALS.format(gb / GB_PER_TB)} TB`;
	return `${TWO_DECIMALS.format(gb)} GB`;
}

/** @example fileNameOf('/movies/A/a.mkv') // 'a.mkv' */
export function fileNameOf(path: string): string {
	return path.slice(path.lastIndexOf('/') + 1);
}

/** @example formatPercent(72.9) // '72,9%' */
export function formatPercent(value: number): string {
	return `${PERCENT.format(value)}%`;
}

/** @example formatErrorDate('2026-10-12T10:00:00.000Z') // '12/10/2026 07:00' in São Paulo */
export function formatErrorDate(iso: string | null): string {
	return iso ? formatDateTime(iso).replace(', ', ' ') : '—';
}

const KIND_LABEL: Record<TdarrWorkerKind, string> = { transcode: 'Transcode', healthCheck: 'Health check' };

/** @example workerTypeLabel('healthCheck', 'cpu') // 'Health check CPU' */
export function workerTypeLabel(kind: TdarrWorkerKind, hardware: TdarrHardware): string {
	return `${KIND_LABEL[kind]} ${hardware.toUpperCase()}`;
}
