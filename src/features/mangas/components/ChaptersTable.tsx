import type { UseQueryResult } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import { Table, Td, Th } from '../../../components/ui/Table';
import { getApiErrorMessage } from '../../../lib/apiError';
import { formatDateTime } from '../../../lib/formatDate';
import { formatVolume } from '../lib/formatVolume';
import type { Chapter, MissingChapter } from '../services/types';


interface ChaptersTableProps {
	query: UseQueryResult<Chapter[]>;
	pendingChapterId: number | null | undefined;
	/** Chapter whose source replace is in flight; its fix actions are locked. */
	replacingChapterId: number | null | undefined;
	onEnqueue: (chapter: Chapter) => void;
	onReplace: (chapter: Chapter) => void;
	onBlock: (chapter: Chapter) => void;
}

export function ChaptersTable({
	query,
	pendingChapterId,
	replacingChapterId,
	onEnqueue,
	onReplace,
	onBlock
}: ChaptersTableProps) {
	if (query.isLoading) return <p className='text-xs text-text-muted'>Carregando capítulos…</p>;
	if (query.isError) {
		return (
			<p className='rounded-md bg-danger-bg px-3 py-2 text-xs text-danger'>
				Não foi possível carregar os capítulos: {getApiErrorMessage(query.error)}
			</p>
		);
	}
	if (!query.data?.length) return <p className='text-xs text-text-subtle'>Nenhum capítulo registrado</p>;

	return (
		<Table>
			<thead>
				<tr>
					<Th className='w-20'>Volume</Th>
					<Th>Nome</Th>
					<Th className='w-44'>Baixado em</Th>
					<Th className='w-64 text-right'>Ações</Th>
				</tr>
			</thead>
			<tbody>
				{query.data.map((chapter) => {
					const isReplacing = replacingChapterId === chapter.idChapter;
					return (
						<tr key={chapter.idChapter} className='group transition-colors hover:bg-surface-raised/60'>
							<Td className='font-mono text-xs'>{formatVolume(chapter.volume)}</Td>
							<Td>{chapter.name}</Td>
							<Td className='text-xs text-text-muted'>
								{chapter.downloadedAt ? formatDateTime(chapter.downloadedAt) : <span className='text-warning'>não baixado</span>}
							</Td>
							<Td className='space-x-1 text-right'>
								{!chapter.downloadedAt && (
									<Button
										size='sm'
										variant='ghost'
										aria-label={`Baixar ${chapter.name}`}
										disabled={pendingChapterId === chapter.idChapter}
										onClick={() => onEnqueue(chapter)}
									>
										Baixar
									</Button>
								)}
								<Button
									size='sm'
									variant='ghost'
									aria-label={`Trocar fonte ${chapter.name}`}
									disabled={isReplacing}
									onClick={() => onReplace(chapter)}
								>
									{isReplacing ? 'Trocando…' : 'Trocar fonte'}
								</Button>
								<Button
									size='sm'
									variant='ghost'
									aria-label={`Apagar e bloquear ${chapter.name}`}
									className='text-danger opacity-70 hover:text-danger group-hover:opacity-100 focus-visible:opacity-100'
									disabled={isReplacing}
									onClick={() => onBlock(chapter)}
								>
									Apagar e bloquear
								</Button>
							</Td>
						</tr>
					);
				})}
			</tbody>
		</Table>
	);
}

export function MissingChapters({ chapters }: { chapters: MissingChapter[] }) {
	if (chapters.length === 0) {
		return <p className='mb-3 rounded-md bg-success-bg px-3 py-2 text-xs text-success'>Nenhum capítulo faltando</p>;
	}
	return (
		<div className='mb-3 rounded-md border border-warning/30 bg-warning-bg px-3 py-2'>
			<p className='mb-1 text-xs font-medium text-warning'>{chapters.length} capítulos faltando</p>
			<ul className='flex flex-wrap gap-1.5'>
				{chapters.map((chapter) => (
					<li key={`${chapter.idMangaConnector}-${chapter.id}`} className='rounded-sm bg-surface px-1.5 py-0.5 text-xs text-text'>
						<span className='mr-1 font-mono text-text-muted'>{formatVolume(chapter.volume)}</span>
						{chapter.title ?? chapter.id}
					</li>
				))}
			</ul>
		</div>
	);
}
