import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { formatDateTime } from '../../../lib/formatDate';
import { formatVolume } from '../lib/formatVolume';
import type { BlockedChapter } from '../services/types';

interface BlockedChaptersCardProps {
	items: BlockedChapter[];
	onUnblock: (idBlockedChapter: number) => void;
}

function BlockedRow({ item, onUnblock }: { item: BlockedChapter; onUnblock: (id: number) => void }) {
	return (
		<li className='group flex min-h-11 flex-wrap items-center gap-3 transition-colors hover:bg-surface-raised/60'>
			<span className='font-mono text-xs text-text'>{item.idPlugin}</span>
			<span className='font-mono text-xs text-text-muted'>{formatVolume(item.volume)}</span>
			<span className='min-w-0 flex-1 truncate text-xs text-text-muted'>{item.reason || '—'}</span>
			<span className='text-xs text-text-subtle'>{formatDateTime(item.createdAt)}</span>
			<Button
				size='sm'
				variant='ghost'
				aria-label={`Desbloquear ${item.idPlugin} volume ${formatVolume(item.volume)}`}
				onClick={() => onUnblock(item.idBlockedChapter)}
			>
				Desbloquear
			</Button>
		</li>
	);
}

/**
 * Chapters blocked for one manga: why, when, and a way to let the source
 * bring them back.
 * @example <BlockedChaptersCard items={blocked.data ?? []} onUnblock={(id) => unblock.mutate(id)} />
 */
export function BlockedChaptersCard({ items, onUnblock }: BlockedChaptersCardProps) {
	return (
		<Card>
			<h2 className='mb-2 text-[11px] font-medium uppercase tracking-wider text-text-subtle'>Capítulos bloqueados</h2>
			{items.length === 0 ? (
				<p className='text-xs text-text-subtle'>Nenhum capítulo bloqueado</p>
			) : (
				<ul className='divide-y divide-border'>
					{items.map((item) => (
						<BlockedRow key={item.idBlockedChapter} item={item} onUnblock={onUnblock} />
					))}
				</ul>
			)}
		</Card>
	);
}
