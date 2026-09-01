import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useMangas } from '../hooks/useMangas';
import { usePlugins } from '../hooks/usePlugins';
import { fetchMangasByPlugin } from '../services/api';
import type { MangaListItem, MangaFromPlugin, Plugin } from '../services/types';

const toPlugins = (list: Plugin[] | undefined) =>
	(list ?? []).filter((p): p is Plugin => p != null);

const inputCls =
	'rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const labelCls = 'mb-1 block text-sm font-medium text-text-muted';

type Step = 'list' | 'select-plugin' | 'select-manga' | 'confirm-add';

interface NewMangaForm {
	plugin: Plugin | null;
	mangaFromPlugin: MangaFromPlugin | null;
	localTitle: string;
}

export function MangasListPage() {
	const { mangas, deleteManga, addManga } = useMangas();
	const { data: plugins } = usePlugins();

	const [filterTitle, setFilterTitle] = useState('');
	const [pendingDelete, setPendingDelete] = useState<MangaListItem | null>(
		null
	);

	const [step, setStep] = useState<Step>('list');
	const [pluginFilter, setPluginFilter] = useState('');
	const [newManga, setNewManga] = useState<NewMangaForm>({
		plugin: null,
		mangaFromPlugin: null,
		localTitle: ''
	});
	const [availableMangas, setAvailableMangas] = useState<MangaFromPlugin[]>([]);
	const [loadingMangas, setLoadingMangas] = useState(false);
	const [mangaTitleFilter, setMangaTitleFilter] = useState('');

	const filteredPluginMangas = availableMangas.filter((m) =>
		!mangaTitleFilter ||
		m.title.toLowerCase().includes(mangaTitleFilter.toLowerCase())
	);

	const filteredMangas = (mangas.data ?? []).filter((m) =>
		m.title.toLowerCase().includes(filterTitle.toLowerCase())
	);

	async function handlePluginSelected(plugin: Plugin) {
		setNewManga((prev) => ({ ...prev, plugin }));
		setLoadingMangas(true);
		setMangaTitleFilter('');
		try {
			const list = await fetchMangasByPlugin(plugin.id);
			const seen = new Set<string>();
			const deduped = list.filter((m) => {
				if (seen.has(m.title)) return false;
				seen.add(m.title);
				return true;
			});
			setAvailableMangas(deduped);
			setStep('select-manga');
		} finally {
			setLoadingMangas(false);
		}
	}

	function handleMangaFromPluginSelected(manga: MangaFromPlugin) {
		setNewManga((prev) => ({
			...prev,
			mangaFromPlugin: manga,
			localTitle: manga.title
		}));
		setStep('confirm-add');
	}

	function handleAddConfirm() {
		if (!newManga.plugin || !newManga.mangaFromPlugin) return;
		addManga.mutate(
			{
				title: newManga.localTitle,
				idPlugin: newManga.plugin.id,
				idMangaPlugin: newManga.mangaFromPlugin.id,
				titlePlugin: newManga.mangaFromPlugin.title
			},
			{
				onSuccess: () => {
					setStep('list');
					setNewManga({ plugin: null, mangaFromPlugin: null, localTitle: '' });
				}
			}
		);
	}

	return (
		<div>
			<div className='mb-6 flex items-center justify-between'>
				<h1 className='text-3xl font-semibold tracking-tight text-text'>Mangas</h1>
				<Button variant='primary' onClick={() => setStep('select-plugin')}>
					Adicionar Manga
				</Button>
			</div>

			{step === 'list' && (
				<>
					<div className='mb-4 flex flex-wrap gap-4'>
						<input
							type='text'
							placeholder='Filtrar por título...'
							value={filterTitle}
							onChange={(e) => setFilterTitle(e.target.value)}
							className={inputCls}
						/>
					</div>

					{mangas.isLoading && <LoadingSpinner />}

					{filteredMangas.length === 0 && !mangas.isLoading && (
						<p className='text-sm text-text-muted'>Nenhum manga encontrado.</p>
					)}

					<ul className='space-y-2'>
						{filteredMangas.map((manga) => (
							<li
								key={manga.idManga}
								className='flex items-center justify-between rounded-lg border border-border bg-surface p-4'
							>
								<div>
									<p className='font-medium text-text'>{manga.title}</p>
								</div>
								<button
									onClick={() => setPendingDelete(manga)}
									className='rounded border border-danger/40 px-3 py-1 text-xs text-danger transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
								>
									Deletar
								</button>
							</li>
						))}
					</ul>
				</>
			)}

			{step === 'select-plugin' && (
				<Card>
					<h2 className='mb-4 text-lg font-semibold text-text'>Selecione um Plugin</h2>
					{loadingMangas && <LoadingSpinner />}
					<div className='mb-4'>
						<label htmlFor='new-manga-plugin' className={labelCls}>
							Plugin
						</label>
						<input
							type='text'
							placeholder='Filtrar plugin...'
							value={pluginFilter}
							onChange={(e) => setPluginFilter(e.target.value)}
							className={`mb-1 block w-full ${inputCls}`}
						/>
						<select
							id='new-manga-plugin'
							value={newManga.plugin?.id ?? ''}
							onChange={(e) => {
								const plugin =
									toPlugins(plugins).find((p) => p.id === e.target.value) ??
									null;
								setNewManga((prev) => ({ ...prev, plugin }));
							}}
							className={`w-full ${inputCls}`}
						>
							<option value=''>Selecione um plugin</option>
							{toPlugins(plugins)
								.filter((p) =>
									!pluginFilter ||
									(p.name ?? p.id ?? '').toLowerCase().includes(pluginFilter.toLowerCase())
								)
								.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name || p.id}
									</option>
								))}
						</select>
					</div>
					<div className='flex gap-3'>
						<Button
							variant='primary'
							onClick={() =>
								newManga.plugin && handlePluginSelected(newManga.plugin)
							}
							disabled={!newManga.plugin || loadingMangas}
						>
							Próximo
						</Button>
						<Button variant='ghost' onClick={() => { setStep('list'); }}>
							Cancelar
						</Button>
					</div>
				</Card>
			)}

			{step === 'select-manga' && (
				<Card>
					<h2 className='mb-4 text-lg font-semibold text-text'>
						Selecione um Manga ({newManga.plugin?.name})
					</h2>
					<input
						type='text'
						placeholder='Filtrar manga por título...'
						value={mangaTitleFilter}
						onChange={(e) => setMangaTitleFilter(e.target.value)}
						className={`mb-4 block w-full ${inputCls}`}
					/>
					{filteredPluginMangas.length === 0 && (
						<p className='text-sm text-text-muted'>Nenhum manga disponível.</p>
					)}
					<ul className='max-h-96 space-y-2 overflow-y-auto'>
						{filteredPluginMangas.map((manga) => (
							<li key={manga.title}>
								<button
									onClick={() => handleMangaFromPluginSelected(manga)}
									className='w-full rounded-md border border-border px-4 py-3 text-left text-sm text-text transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
								>
									{manga.title}
								</button>
							</li>
						))}
					</ul>
					<Button
						variant='ghost'
						className='mt-4'
						onClick={() => setStep('select-plugin')}
					>
						Voltar
					</Button>
				</Card>
			)}

			{step === 'confirm-add' &&
				newManga.mangaFromPlugin &&
				newManga.plugin && (
					<Card>
						<h2 className='mb-4 text-lg font-semibold text-text'>Adicionar Manga</h2>
						<div className='space-y-4'>
							<div>
								<label className={labelCls}>
									Título (pasta local)
								</label>
								<input
									type='text'
									value={newManga.localTitle}
									onChange={(e) =>
										setNewManga((prev) => ({
											...prev,
											localTitle: e.target.value
										}))
									}
									className={`w-full ${inputCls}`}
								/>
							</div>
							<div>
								<label className={labelCls}>
									Título no Plugin
								</label>
								<input
									type='text'
									value={newManga.mangaFromPlugin.title}
									readOnly
									className='w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-muted'
								/>
							</div>
							<div>
								<label className={labelCls}>
									Plugin
								</label>
								<input
									type='text'
									value={newManga.plugin.name}
									readOnly
									className='w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-muted'
								/>
							</div>
						</div>
						<div className='mt-6 flex gap-3'>
							<Button
								variant='primary'
								onClick={handleAddConfirm}
								disabled={!newManga.localTitle || addManga.isPending}
							>
								{addManga.isPending ? 'Adicionando...' : 'Adicionar'}
							</Button>
							<Button variant='secondary' onClick={() => { setStep('list'); }}>
								Cancelar
							</Button>
						</div>
					</Card>
				)}

			<ConfirmDialog
				open={pendingDelete !== null}
				title='Deletar manga'
				message={`Tem certeza que deseja deletar "${pendingDelete?.title}"?`}
				onConfirm={() => {
					if (pendingDelete) deleteManga.mutate(pendingDelete.idManga);
					setPendingDelete(null);
				}}
				onCancel={() => setPendingDelete(null)}
			/>
		</div>
	);
}
