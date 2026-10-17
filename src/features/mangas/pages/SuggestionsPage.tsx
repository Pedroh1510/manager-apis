import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { TablePlaceholder } from '../../../components/ui/TablePlaceholder';
import { getApiErrorMessage } from '../../../lib/apiError';
import { MangaCover } from '../components/MangaCover';
import { SuggestionCard } from '../components/SuggestionCard';
import { useCoverSuggestions } from '../hooks/useCoverSuggestions';
import { usePlugins } from '../hooks/usePlugins';
import { groupByManga } from '../lib/coverSuggestions';
import { mangaCoverUrl } from '../services/coverUrls';
import type { CoverSuggestion } from '../services/types';

type Actions = ReturnType<typeof useCoverSuggestions>;

export function SuggestionsPage() {
	const actions = useCoverSuggestions();
	const { data: plugins } = usePlugins();
	const pluginName = (id: string) => plugins?.find((plugin) => plugin?.id === id)?.name || id;

	return (
		<div className='mx-auto max-w-4xl'>
			<header className='mb-5'>
				<h1 className='text-xl font-semibold tracking-tight text-text'>Sugestões</h1>
				<p className='mt-0.5 text-xs text-text-muted'>Conectores faltantes encontrados pela semelhança da capa</p>
			</header>
			<SuggestionsBody actions={actions} pluginName={pluginName} />
		</div>
	);
}

function SuggestionsBody({ actions, pluginName }: { actions: Actions; pluginName: (id: string) => string }) {
	const { suggestions: query, accept, dismiss } = actions;
	if (query.isLoading) return <TablePlaceholder />;
	if (query.isError) {
		return (
			<EmptyState title='Não foi possível carregar as sugestões' detail={getApiErrorMessage(query.error)}>
				<Button onClick={() => query.refetch()}>Tentar de novo</Button>
			</EmptyState>
		);
	}
	const { suggestions = [], conflicts = [] } = query.data ?? {};
	if (!suggestions.length && !conflicts.length) {
		return <EmptyState title='Nenhuma sugestão pendente' detail='Novas sugestões aparecem depois de cada atualização dos catálogos.' />;
	}
	const isBusy = accept.isPending || dismiss.isPending;
	return (
		<div className='space-y-6'>
			{groupByManga(suggestions).map(([idManga, group]) => (
				<MangaGroup key={idManga} manga={group[0]}>
					{group.map((suggestion) => (
						<SuggestionCard
							key={suggestion.idSuggestion}
							suggestion={suggestion}
							pluginName={pluginName(suggestion.idPlugin)}
							isBusy={isBusy}
							onAccept={() => accept.mutate(suggestion)}
							onDismiss={() => dismiss.mutate(suggestion)}
						/>
					))}
				</MangaGroup>
			))}
			{conflicts.length > 0 && (
				<section aria-labelledby='duplicates-heading'>
					<h2 id='duplicates-heading' className='mb-2 text-sm font-semibold text-text'>
						Possíveis duplicatas
					</h2>
					<ul className='space-y-2'>
						{conflicts.map((conflict) => (
							<SuggestionCard
								key={conflict.idSuggestion}
								suggestion={conflict}
								pluginName={pluginName(conflict.idPlugin)}
								isBusy={isBusy}
								onDismiss={() => dismiss.mutate(conflict)}
							/>
						))}
					</ul>
				</section>
			)}
		</div>
	);
}

function MangaGroup({ manga, children }: { manga: CoverSuggestion; children: ReactNode }) {
	return (
		<section data-testid='suggestion-group' className='flex gap-4'>
			<MangaCover src={mangaCoverUrl(manga.idManga)} title={manga.title} width={96} height={136} />
			<div className='min-w-0 flex-1'>
				<Link
					to={`/mangas/${manga.idManga}`}
					className={`rounded-sm text-sm font-semibold text-text hover:text-accent hover:underline ${FOCUS_RING}`}
				>
					{manga.title}
				</Link>
				<ul className='mt-2 space-y-2'>{children}</ul>
			</div>
		</section>
	);
}

function EmptyState({ title, detail, children }: { title: string; detail: string; children?: ReactNode }) {
	return (
		<div className='flex flex-col items-center rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center'>
			<p className='text-sm font-medium text-text'>{title}</p>
			<p className='mb-4 mt-1 max-w-sm text-xs text-text-muted'>{detail}</p>
			{children}
		</div>
	);
}
