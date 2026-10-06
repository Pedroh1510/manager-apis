import type { QueueSummary } from '../services/types';

const SHOWN_COUNTS = [
	{ key: 'active', label: 'Ativos' },
	{ key: 'waiting', label: 'Espera' },
	{ key: 'delayed', label: 'Atraso' },
	{ key: 'failed', label: 'Falhos' }
] as const;

/**
 * One card per queue; a queue with failed jobs is the only thing drawn in red.
 * @example <QueueCards queues={summary} />
 */
export function QueueCards({ queues }: { queues: QueueSummary[] }) {
	return (
		<ul className='grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2'>
			{queues.map((queue) => {
				const hasFailures = queue.counts.failed > 0;
				return (
					<li
						key={queue.name}
						data-testid={`queue-card-${queue.name}`}
						className={`rounded-lg border bg-surface px-3 py-2.5 shadow-raised ${hasFailures ? 'border-danger/60' : 'border-border'}`}
					>
						<p className='mb-2 truncate font-mono text-xs text-text'>{queue.name}</p>
						<dl className='grid grid-cols-4 gap-x-3 gap-y-1'>
							{SHOWN_COUNTS.map(({ key, label }) => (
								<div key={key}>
									<dt className='text-[10px] uppercase tracking-wider text-text-subtle'>{label}</dt>
									<dd
										data-testid={`count-${key}`}
										className={`font-mono text-sm tabular-nums ${key === 'failed' && hasFailures ? 'font-semibold text-danger' : 'text-text'}`}
									>
										{queue.counts[key]}
									</dd>
								</div>
							))}
						</dl>
					</li>
				);
			})}
		</ul>
	);
}
