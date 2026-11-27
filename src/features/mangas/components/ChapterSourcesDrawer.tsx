import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import type { ChapterSource, ChapterSourceStatus } from '../services/types';

export interface ChosenSource {
	idMangaConnector: number;
	idChapterPlugin: string;
}

interface ChapterSourcesDrawerProps {
	open: boolean;
	title: string;
	sources: ChapterSource[] | undefined;
	isLoading: boolean;
	isError: boolean;
	onChoose: (source: ChosenSource) => void;
	onClose: () => void;
}

/**
 * Status label with its reason appended only when there is one.
 * @example withReason('fonte falhou', 'timeout') // 'fonte falhou: timeout'
 */
const withReason = (label: string, reason?: string): string => (reason ? `${label}: ${reason}` : label);

const STATUS_TEXT: Record<Exclude<ChapterSourceStatus, 'available'>, (reason?: string) => string> = {
	missing: () => 'não tem este capítulo',
	blocked: () => 'bloqueado',
	disabled: (reason) => withReason('conector desligado', reason),
	failed: (reason) => withReason('fonte falhou', reason)
};

function SourceRow({ source, onChoose }: { source: ChapterSource; onChoose: (source: ChosenSource) => void }) {
	const isAvailable = source.status === 'available' && source.idChapterPlugin !== undefined;
	const rowTone = isAvailable ? 'bg-surface' : 'bg-surface-raised/50 text-text-subtle';
	return (
		<li className={`flex items-center gap-3 rounded-md border border-border px-3 py-2 ${rowTone}`}>
			<div className='min-w-0 flex-1'>
				<p className={`truncate text-sm ${isAvailable ? 'font-medium text-text' : ''}`}>{source.titlePlugin}</p>
				<p className='font-mono text-xs text-text-muted'>{source.idPlugin}</p>
				{!isAvailable && source.status !== 'available' && (
					<p className='text-xs'>{STATUS_TEXT[source.status](source.reason)}</p>
				)}
			</div>
			{source.isCurrent && (
				<span className='rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent'>atual</span>
			)}
			{isAvailable && (
				<Button
					size='sm'
					variant='primary'
					aria-label={`Usar esta: ${source.titlePlugin}`}
					onClick={() =>
						onChoose({ idMangaConnector: source.idMangaConnector, idChapterPlugin: source.idChapterPlugin as string })
					}
				>
					Usar esta
				</Button>
			)}
		</li>
	);
}

function DrawerBody({ sources, isLoading, isError, onChoose }: Omit<ChapterSourcesDrawerProps, 'open' | 'title' | 'onClose'>) {
	if (isLoading) return <p className='text-xs text-text-muted'>Carregando fontes…</p>;
	if (isError) return <p className='text-xs text-danger'>Não foi possível carregar as fontes</p>;
	return (
		<ul className='space-y-2'>
			{(sources ?? []).map((source) => (
				<SourceRow key={source.idMangaConnector} source={source} onChoose={onChoose} />
			))}
		</ul>
	);
}

/**
 * Side panel listing every linked connector as a candidate source for one
 * chapter; only available ones can be chosen, the rest say why they cannot.
 * @example <ChapterSourcesDrawer open title='Trocar fonte' sources={data} isLoading={false} isError={false} onChoose={pick} onClose={close} />
 */
export function ChapterSourcesDrawer({ open, title, onClose, ...body }: ChapterSourcesDrawerProps) {
	return (
		<Drawer open={open} title={title} onClose={onClose}>
			<DrawerBody {...body} />
		</Drawer>
	);
}
