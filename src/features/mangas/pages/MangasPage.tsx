import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Drawer } from '../../../components/ui/Drawer';
import { Input } from '../../../components/ui/Input';
import { TablePlaceholder } from '../../../components/ui/TablePlaceholder';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { getApiErrorMessage } from '../../../lib/apiError';
import { AddMangaWizard } from '../components/AddMangaWizard';
import { MangasTable } from '../components/MangasTable';
import { useMangas } from '../hooks/useMangas';
import { usePlugins } from '../hooks/usePlugins';
import { filterMangas, useMangaFilters } from '../lib/mangaFilters';
import type { MangaListItem, Plugin } from '../services/types';

const selectCls = `h-8 rounded-md border border-border bg-surface px-2 text-sm text-text ${FOCUS_RING}`;

function toPluginNames(plugins: Plugin[] | undefined): Record<string, string> {
	return Object.fromEntries((plugins ?? []).filter(Boolean).map((p) => [p.id, p.name || p.id]));
}

export function MangasListPage() {
	const { mangas, deleteManga, addManga, setAllConnectorsActive, setConnectorActive } = useMangas();
	const { data: plugins } = usePlugins();
	const { filters, setFilter, clearFilters, hasFilters } = useMangaFilters();
	const [pendingDelete, setPendingDelete] = useState<MangaListItem | null>(null);
	const [isAdding, setIsAdding] = useState(false);

	const all = mangas.data ?? [];
	const visible = filterMangas(all, filters);
	const pluginNames = toPluginNames(plugins);
	const pendingMangaId =
		(setAllConnectorsActive.isPending && setAllConnectorsActive.variables?.idManga) ||
		(setConnectorActive.isPending && setConnectorActive.variables?.idManga) ||
		null;

	return (
		<div className='mx-auto max-w-6xl'>
			<header className='mb-5 flex items-end justify-between gap-4'>
				<div>
					<h1 className='text-xl font-semibold tracking-tight text-text'>Mangás</h1>
					<p className='mt-0.5 text-xs text-text-muted'>
						{mangas.isSuccess ? `${visible.length} de ${all.length} mangás` : 'Catálogo local e seus conectores'}
					</p>
				</div>
				<Button variant='primary' onClick={() => setIsAdding(true)}>
					Adicionar mangá
				</Button>
			</header>

			<div className='mb-3 flex flex-wrap items-center gap-2'>
				<Input
					aria-label='Filtrar por título'
					placeholder='Filtrar por título...'
					value={filters.q}
					onChange={(e) => setFilter('q', e.target.value)}
					className='max-w-xs'
				/>
				<select aria-label='Conector' value={filters.plugin} onChange={(e) => setFilter('plugin', e.target.value)} className={selectCls}>
					<option value=''>Todos os conectores</option>
					{Object.entries(pluginNames).map(([id, name]) => (
						<option key={id} value={id}>
							{name}
						</option>
					))}
				</select>
				<select aria-label='Status' value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className={selectCls}>
					<option value=''>Todos os status</option>
					<option value='active'>Ativo</option>
					<option value='partial'>Parcial</option>
					<option value='inactive'>Inativo</option>
				</select>
				{hasFilters && (
					<Button variant='ghost' size='sm' onClick={clearFilters}>
						Limpar
					</Button>
				)}
			</div>

			<ListBody
				mangas={mangas}
				all={all}
				visible={visible}
				hasFilters={hasFilters}
				onClearFilters={clearFilters}
				onAdd={() => setIsAdding(true)}
				table={
					<MangasTable
						mangas={visible}
						pluginNames={pluginNames}
						pendingMangaId={pendingMangaId}
						onSetAllConnectorsActive={(idManga, isActive) => setAllConnectorsActive.mutate({ idManga, isActive })}
						onSetConnectorActive={(idManga, idPlugin, isActive) => setConnectorActive.mutate({ idManga, idPlugin, isActive })}
						onDelete={setPendingDelete}
					/>
				}
			/>

			<Drawer open={isAdding} title='Adicionar mangá' onClose={() => setIsAdding(false)}>
				<AddMangaWizard
					isAdding={addManga.isPending}
					onAdd={(payload) => addManga.mutate(payload, { onSuccess: () => setIsAdding(false) })}
					onCancel={() => setIsAdding(false)}
				/>
			</Drawer>

			<ConfirmDialog
				open={pendingDelete !== null}
				title='Remover mangá'
				message={`Tem certeza que deseja remover "${pendingDelete?.title}"? Os capítulos baixados também serão apagados.`}
				onConfirm={() => {
					if (pendingDelete) deleteManga.mutate(pendingDelete.idManga);
					setPendingDelete(null);
				}}
				onCancel={() => setPendingDelete(null)}
			/>
		</div>
	);
}

interface ListBodyProps {
	mangas: ReturnType<typeof useMangas>['mangas'];
	all: MangaListItem[];
	visible: MangaListItem[];
	hasFilters: boolean;
	onClearFilters: () => void;
	onAdd: () => void;
	table: ReactNode;
}

function ListBody({ mangas, all, visible, hasFilters, onClearFilters, onAdd, table }: ListBodyProps) {
	if (mangas.isLoading) return <TablePlaceholder />;
	if (mangas.isError) {
		return (
			<EmptyState title='Não foi possível carregar os mangás' detail={getApiErrorMessage(mangas.error)}>
				<Button onClick={() => mangas.refetch()}>Tentar de novo</Button>
			</EmptyState>
		);
	}
	if (all.length === 0) {
		return (
			<EmptyState title='Nenhum mangá cadastrado' detail='Escolha um plugin e um título do catálogo para começar.'>
				<Button variant='primary' onClick={onAdd}>
					Adicionar mangá
				</Button>
			</EmptyState>
		);
	}
	if (visible.length === 0 && hasFilters) {
		return (
			<EmptyState title='Nenhum mangá com esses filtros' detail='Ajuste a busca ou volte para a lista completa.'>
				<Button onClick={onClearFilters}>Limpar filtros</Button>
			</EmptyState>
		);
	}
	return <>{table}</>;
}

function EmptyState({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
	return (
		<div className='flex flex-col items-center rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center'>
			<p className='text-sm font-medium text-text'>{title}</p>
			<p className='mb-4 mt-1 max-w-sm text-xs text-text-muted'>{detail}</p>
			{children}
		</div>
	);
}
