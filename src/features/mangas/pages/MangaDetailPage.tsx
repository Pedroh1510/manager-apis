import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { TablePlaceholder } from '../../../components/ui/TablePlaceholder';
import { Toggle } from '../../../components/ui/Toggle';
import { useErrorToast } from '../../../components/ui/useErrorToast';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { ChaptersTable, MissingChapters } from '../components/ChaptersTable';
import { useMangaChapters } from '../hooks/useMangaChapters';
import { useMangas } from '../hooks/useMangas';
import { usePlugins } from '../hooks/usePlugins';
import { deriveMangaStatus } from '../lib/mangaStatus';
import type { Chapter, MangaListItem } from '../services/types';

const linkCls = `rounded-sm text-xs text-text-muted hover:text-text ${FOCUS_RING}`;

export function MangaDetailPage() {
	const idManga = Number(useParams().idManga);
	const { mangas } = useMangas();
	const manga = mangas.data?.find((item) => item.idManga === idManga);
	useErrorToast(mangas.error);

	if (mangas.isLoading) return <TablePlaceholder />;
	if (mangas.isError) return <LoadFailed onRetry={() => mangas.refetch()} />;
	if (!manga) return <NotFound />;
	return <MangaDetail manga={manga} />;
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
	return (
		<div className='mx-auto max-w-md rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center'>
			<p className='text-sm font-medium text-text'>Não foi possível carregar o mangá</p>
			<p className='mb-4 mt-1 text-xs text-text-muted'>A API de mangás não respondeu.</p>
			<Button onClick={onRetry}>Tentar de novo</Button>
		</div>
	);
}

function NotFound() {
	return (
		<div className='mx-auto max-w-md rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center'>
			<p className='text-sm font-medium text-text'>Mangá não encontrado</p>
			<p className='mb-4 mt-1 text-xs text-text-muted'>Ele pode ter sido removido ou o endereço está errado.</p>
			<Link to='/mangas/list' className={linkCls}>
				← Voltar para a lista
			</Link>
		</div>
	);
}

function MangaDetail({ manga }: { manga: MangaListItem }) {
	const { setConnectorActive } = useMangas();
	const { data: plugins } = usePlugins();
	const { chapters, missing, enqueueChapter, removeChapter } = useMangaChapters(manga.idManga);
	useErrorToast(chapters.error);
	const [pendingDelete, setPendingDelete] = useState<Chapter | null>(null);
	const pluginName = (idPlugin: string) => plugins?.find((p) => p?.id === idPlugin)?.name || idPlugin;

	return (
		<div className='mx-auto max-w-5xl space-y-6'>
			<Link to='/mangas/list' className={linkCls}>
				← Mangás
			</Link>
			<header className='flex items-end justify-between gap-4'>
				<div className='flex items-center gap-3'>
					<h1 className='text-xl font-semibold tracking-tight text-text'>{manga.title}</h1>
					<StatusBadge status={deriveMangaStatus(manga.connectors)} />
				</div>
				<a
					href={`${import.meta.env.VITE_MANGAS_API_URL}/mangas/adm/${manga.idManga}/download`}
					className={`inline-flex h-8 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-text shadow-raised hover:bg-surface-raised ${FOCUS_RING}`}
				>
					Baixar zip
				</a>
			</header>

			<section aria-labelledby='connectors-title'>
				<SectionTitle id='connectors-title'>Conectores</SectionTitle>
				{manga.connectors.length === 0 ? (
					<p className='text-xs text-text-subtle'>Nenhum conector vinculado.</p>
				) : (
					<ul className='divide-y divide-border rounded-lg border border-border bg-surface shadow-raised'>
						{manga.connectors.map((connector) => (
							<li key={connector.idMangaConnector} className='flex h-11 items-center gap-3 px-3'>
								<Toggle
									checked={connector.isActive}
									disabled={setConnectorActive.isPending}
									label={`Conector ${pluginName(connector.idPlugin)} de ${manga.title}`}
									onChange={(isActive) =>
										setConnectorActive.mutate({ idManga: manga.idManga, idPlugin: connector.idPlugin, isActive })
									}
								/>
								<span className='font-mono text-xs text-text'>{pluginName(connector.idPlugin)}</span>
								<span className='truncate text-xs text-text-muted'>{connector.titlePlugin}</span>
							</li>
						))}
					</ul>
				)}
			</section>

			<section aria-labelledby='chapters-title'>
				<div className='flex items-center justify-between'>
					<SectionTitle id='chapters-title'>Capítulos</SectionTitle>
					<Button size='sm' onClick={() => missing.mutate()} disabled={missing.isPending}>
						{missing.isPending ? 'Verificando…' : 'Verificar faltantes'}
					</Button>
				</div>
				{missing.isSuccess && <MissingChapters chapters={missing.data} />}
				<ChaptersTable
					query={chapters}
					pendingChapterId={enqueueChapter.isPending ? enqueueChapter.variables : null}
					onEnqueue={(chapter) => enqueueChapter.mutate(chapter.idChapter)}
					onDelete={setPendingDelete}
				/>
			</section>

			<ConfirmDialog
				open={pendingDelete !== null}
				title='Remover capítulo'
				message={`Remover "${pendingDelete?.name}" e o arquivo baixado?`}
				onConfirm={() => {
					if (pendingDelete) removeChapter.mutate(pendingDelete.idChapter);
					setPendingDelete(null);
				}}
				onCancel={() => setPendingDelete(null)}
			/>
		</div>
	);
}

function SectionTitle({ id, children }: { id: string; children: string }) {
	return (
		<h2 id={id} className='mb-2 text-[11px] font-medium uppercase tracking-wider text-text-subtle'>
			{children}
		</h2>
	);
}
