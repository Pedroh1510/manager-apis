import { formatGigabytes } from '../lib/formatTdarr';
import type { TdarrStats } from '../services/types';
import { TdarrStatList } from './TdarrStatList';

function StatBlock({ title, rows, columns }: { title: string; rows: [string, string][]; columns: string }) {
	return (
		<section aria-label={title} className='space-y-3 rounded-lg border border-border bg-surface p-4 shadow-raised'>
			<h2 className='text-sm font-semibold text-text'>{title}</h2>
			<TdarrStatList rows={rows} className={columns} />
		</section>
	);
}

/**
 * Library-wide totals and the queue/success/error counters of both job kinds.
 * @example <TdarrStatsPanel stats={data} />
 */
export function TdarrStatsPanel({ stats }: { stats: TdarrStats }) {
	const { totals, transcode, healthCheck } = stats;
	return (
		<div className='grid gap-4 lg:grid-cols-3'>
			<StatBlock
				title='Totais'
				columns='grid-cols-2'
				rows={[
					['Arquivos', String(totals.files)],
					['Transcodes', String(totals.transcodes)],
					['Health checks', String(totals.healthChecks)],
					['Espaço economizado', formatGigabytes(totals.spaceSavedGb)]
				]}
			/>
			<StatBlock
				title='Transcode'
				columns='grid-cols-2'
				rows={[
					['Em espera', String(transcode.onHold)],
					['Na fila', String(transcode.queued)],
					['Sucesso', String(transcode.succeeded)],
					['Erro', String(transcode.failed)]
				]}
			/>
			<StatBlock
				title='Health check'
				columns='grid-cols-2'
				rows={[
					['Na fila', String(healthCheck.queued)],
					['Sucesso', String(healthCheck.succeeded)],
					['Erro', String(healthCheck.failed)]
				]}
			/>
		</div>
	);
}
