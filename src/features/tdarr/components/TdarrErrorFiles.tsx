import { fileNameOf, formatErrorDate } from '../lib/formatTdarr';
import type { TdarrErrorList } from '../services/types';

/**
 * Newest failed files of one kind; notes how many more Tdarr holds beyond the page.
 * @example <TdarrErrorFiles title='Erros de transcode' list={stats.errors.transcode} />
 */
export function TdarrErrorFiles({ title, list }: { title: string; list: TdarrErrorList }) {
	const isTruncated = list.total > list.items.length;
	return (
		<section aria-label={title} className='rounded-lg border border-border bg-surface shadow-raised'>
			<header className='flex items-baseline justify-between gap-2 border-b border-border px-4 py-3'>
				<h2 className='text-sm font-semibold text-text'>{title}</h2>
				{isTruncated && <span className='text-xs text-text-muted'>{`mostrando ${list.items.length} de ${list.total}`}</span>}
			</header>
			{list.items.length === 0 ? (
				<p className='px-4 py-6 text-center text-sm text-text-muted'>Nenhum erro</p>
			) : (
				<ul className='max-h-96 divide-y divide-border overflow-y-auto'>
					{list.items.map((item) => (
						<li key={item.file} className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-2 text-sm'>
							<span title={item.file} className='min-w-0 truncate text-text'>
								{fileNameOf(item.file)}
							</span>
							<span className='flex gap-3 font-mono text-xs text-text-muted'>
								<span>{item.library}</span>
								<span>{formatErrorDate(item.date)}</span>
							</span>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
