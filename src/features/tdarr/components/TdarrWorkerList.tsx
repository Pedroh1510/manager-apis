import { fileNameOf, formatGigabytes, formatPercent, workerTypeLabel } from '../lib/formatTdarr';
import type { TdarrNode, TdarrWorker } from '../services/types';

function TdarrWorkerRow({ worker, nodeName }: { worker: TdarrWorker; nodeName: string }) {
	return (
		<li className='space-y-2 px-4 py-3'>
			<div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
				<span title={worker.file} className='min-w-0 truncate text-sm font-medium text-text'>
					{fileNameOf(worker.file)}
				</span>
				<span className='font-mono text-sm text-text'>{formatPercent(worker.percentage)}</span>
			</div>
			<div
				role='progressbar'
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={worker.percentage}
				aria-label={`Progresso de ${fileNameOf(worker.file)}`}
				className='h-1.5 overflow-hidden rounded-full bg-surface-raised'
			>
				<div className='h-full rounded-full bg-accent transition-[width] duration-500' style={{ width: `${worker.percentage}%` }} />
			</div>
			<div className='flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-text-muted'>
				<span>{worker.eta}</span>
				<span>{`${worker.fps} fps`}</span>
				<span>{workerTypeLabel(worker.kind, worker.hardware)}</span>
				<span>{nodeName}</span>
				<span>{`${formatGigabytes(worker.originalSizeGb)} → ${formatGigabytes(worker.estimatedSizeGb)}`}</span>
			</div>
		</li>
	);
}

/**
 * Every active worker across nodes, with progress; one line when none is running.
 * @example <TdarrWorkerList nodes={overview.nodes} />
 */
export function TdarrWorkerList({ nodes }: { nodes: TdarrNode[] }) {
	const rows = nodes.flatMap((node) => node.workers.map((worker) => ({ worker, nodeName: node.name })));
	if (rows.length === 0) return <p className='px-4 py-6 text-center text-sm text-text-muted'>Nenhum worker ativo</p>;
	return (
		<ul className='divide-y divide-border'>
			{rows.map(({ worker, nodeName }) => (
				<TdarrWorkerRow key={worker.id} worker={worker} nodeName={nodeName} />
			))}
		</ul>
	);
}
