import { Badge } from '../../../components/ui/Badge';
import type { TdarrNode } from '../services/types';
import { TdarrStatList } from './TdarrStatList';

/**
 * One node: paused or running, heartbeat state, busy workers and the limit per worker type.
 * @example <TdarrNodeCard node={overview.nodes[0]} />
 */
export function TdarrNodeCard({ node }: { node: TdarrNode }) {
	const { workerLimits: limits } = node;
	return (
		<article
			data-testid='tdarr-node'
			className={`space-y-3 rounded-lg border bg-surface p-4 shadow-raised ${node.online ? 'border-border' : 'border-danger/40'}`}
		>
			<header className='flex flex-wrap items-center justify-between gap-2'>
				<h3 className='font-mono text-sm font-semibold text-text'>{node.name}</h3>
				<div className='flex gap-1.5'>
					<Badge variant={node.paused ? 'warning' : 'success'}>{node.paused ? 'Pausado' : 'Ativo'}</Badge>
					<Badge variant={node.online ? 'success' : 'danger'}>{node.online ? 'Online' : 'Offline'}</Badge>
				</div>
			</header>
			<p className='text-sm text-text-muted'>{`${node.busyWorkers}/${node.workerCapacity} workers ocupados`}</p>
			<TdarrStatList
				className='grid-cols-2 sm:grid-cols-4'
				rows={[
					['Transcode GPU', String(limits.transcodeGpu)],
					['Transcode CPU', String(limits.transcodeCpu)],
					['Health check GPU', String(limits.healthCheckGpu)],
					['Health check CPU', String(limits.healthCheckCpu)]
				]}
			/>
		</article>
	);
}
