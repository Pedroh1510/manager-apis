import type { ReactNode } from 'react';
import { Card } from '../../../components/ui/Card';
import { formatEta } from '../lib/formatTorrent';
import type { TorrentsSummary } from '../services/types';

interface SummaryCardProps {
	label: string;
	value: ReactNode;
	note?: string;
}

function SummaryCard({ label, value, note }: SummaryCardProps) {
	return (
		<Card data-testid='torrent-card' padding='sm'>
			<p className='text-[11px] font-medium uppercase tracking-wider text-text-subtle'>{label}</p>
			<p className='mt-1 font-mono text-2xl font-semibold text-text'>{value}</p>
			{note && <p className='mt-0.5 text-xs text-text-muted'>{note}</p>}
		</Card>
	);
}

/**
 * Four counts plus the time until every estimable download ends.
 * @example <TorrentSummaryCards summary={data} />
 */
export function TorrentSummaryCards({ summary }: { summary: TorrentsSummary }) {
	const { counts, overallEtaSeconds, etaUnknownCount } = summary;
	const etaNote = etaUnknownCount > 0 ? `+${etaUnknownCount} sem estimativa` : undefined;
	return (
		<div className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
			<SummaryCard label='Baixando' value={counts.downloading} />
			<SummaryCard label='Concluídos' value={counts.completed} />
			<SummaryCard label='Na fila' value={counts.queued} />
			<SummaryCard label='Parados' value={counts.stopped} />
			<SummaryCard label='ETA geral' value={formatEta(overallEtaSeconds)} note={etaNote} />
		</div>
	);
}
