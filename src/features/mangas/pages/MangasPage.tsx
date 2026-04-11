import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useMangas } from '../hooks/useMangas';
import { usePlugins } from '../hooks/usePlugins';
import { fetchMangasByPlugin } from '../services/api';
import type { MangaListItem, MangaFromPlugin, Plugin } from '../services/types';

const toPlugins = (list: Plugin[] | undefined) =>
	(list ?? []).filter((p): p is Plugin => p != null);

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
	const [filterPlugin, setFilterPlugin] = useState('');
	const [listPluginFilter, setListPluginFilter] = useState('');
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

	const filteredMangas = (mangas.data ?? []).filter((m) => {
		const matchTitle = m.title
			.toLowerCase()
			.includes(filterTitle.toLowerCase());
		const matchPlugin = filterPlugin === '' || m.idPlugin === filterPlugin;
		return matchTitle && matchPlugin;
	});

	async function handlePluginSelected(plugin: Plugin) {
		setNewManga((prev) => ({ ...prev, plugin }));
		setLoadingMangas(true);
		try {
			const list = await fetchMangasByPlugin(plugin.id);
			setAvailableMangas(list);
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
				titleInPlugin: newManga.mangaFromPlugin.title,
				idPlugin: newManga.plugin.id
			},
			{
				onSuccess: () => {
					setStep('list');
					setListPluginFilter('');
					setNewManga({ plugin: null, mangaFromPlugin: null, localTitle: '' });
				}
			}
		);
	}

	return (
		<div>
			<div className='mb-6 flex items-center justify-between'>
				<h1 className='text-2xl font-bold text-gray-900'>Mangas</h1>
				<button
					onClick={() => setStep('select-plugin')}
					className='rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700'
				>
					Adicionar Manga
				</button>
			</div>

			{step === 'list' && (
				<>
					<div className='mb-4 flex flex-wrap gap-4'>
						<input
							type='text'
							placeholder='Filtrar por título...'
							value={filterTitle}
							onChange={(e) => setFilterTitle(e.target.value)}
							className='rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
						<div className='flex items-center gap-2'>
							<label htmlFor='filter-plugin' className='text-sm text-gray-600'>
								Filtrar por plugin
							</label>
							<input
								type='text'
								placeholder='Filtrar plugin...'
								aria-label='Filtrar nome do plugin'
								value={listPluginFilter}
								onChange={(e) => setListPluginFilter(e.target.value)}
								className='mb-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
							<select
								id='filter-plugin'
								value={filterPlugin}
								onChange={(e) => setFilterPlugin(e.target.value)}
								className='rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
							>
								<option value=''>Todos</option>
								{toPlugins(plugins)
									.filter((p) =>
										!listPluginFilter ||
										(p.name ?? p.id ?? '').toLowerCase().includes(listPluginFilter.toLowerCase())
									)
									.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name ?? p.id}
										</option>
									))}
							</select>
						</div>
					</div>

					{mangas.isLoading && <LoadingSpinner />}

					{filteredMangas.length === 0 && !mangas.isLoading && (
						<p className='text-sm text-gray-500'>Nenhum manga encontrado.</p>
					)}

					<ul className='space-y-2'>
						{filteredMangas.map((manga) => (
							<li
								key={manga.title}
								className='flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm'
							>
								<div>
									<p className='font-medium text-gray-900'>{manga.title}</p>
									<p className='text-xs text-gray-500'>
										Plugin: {manga.idPlugin}
									</p>
								</div>
								<button
									onClick={() => setPendingDelete(manga)}
									className='rounded border border-red-400 px-3 py-1 text-xs text-red-700 hover:bg-red-50'
								>
									Deletar
								</button>
							</li>
						))}
					</ul>
				</>
			)}

			{step === 'select-plugin' && (
				<div className='rounded-lg border bg-white p-6 shadow-sm'>
					<h2 className='mb-4 text-lg font-semibold'>Selecione um Plugin</h2>
					{loadingMangas && <LoadingSpinner />}
					<div className='mb-4'>
						<label
							htmlFor='new-manga-plugin'
							className='mb-1 block text-sm font-medium text-gray-700'
						>
							Plugin
						</label>
						<input
							type='text'
							placeholder='Filtrar plugin...'
							value={pluginFilter}
							onChange={(e) => setPluginFilter(e.target.value)}
							className='mb-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
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
							className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
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
						<button
							onClick={() =>
								newManga.plugin && handlePluginSelected(newManga.plugin)
							}
							disabled={!newManga.plugin || loadingMangas}
							className='rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50'
						>
							Próximo
						</button>
						<button
							onClick={() => { setStep('list'); setListPluginFilter(''); }}
							className='text-sm text-gray-500 hover:underline'
						>
							Cancelar
						</button>
					</div>
				</div>
			)}

			{step === 'select-manga' && (
				<div className='rounded-lg border bg-white p-6 shadow-sm'>
					<h2 className='mb-4 text-lg font-semibold'>
						Selecione um Manga ({newManga.plugin?.name})
					</h2>
					{availableMangas.length === 0 && (
						<p className='text-sm text-gray-500'>Nenhum manga disponível.</p>
					)}
					<ul className='max-h-96 space-y-2 overflow-y-auto'>
						{availableMangas.map((manga) => (
							<li key={manga.title}>
								<button
									onClick={() => handleMangaFromPluginSelected(manga)}
									className='w-full rounded-md border border-gray-200 px-4 py-3 text-left text-sm hover:bg-gray-50'
								>
									{manga.title}
								</button>
							</li>
						))}
					</ul>
					<button
						onClick={() => setStep('select-plugin')}
						className='mt-4 text-sm text-gray-500 hover:underline'
					>
						Voltar
					</button>
				</div>
			)}

			{step === 'confirm-add' &&
				newManga.mangaFromPlugin &&
				newManga.plugin && (
					<div className='rounded-lg border bg-white p-6 shadow-sm'>
						<h2 className='mb-4 text-lg font-semibold'>Adicionar Manga</h2>
						<div className='space-y-4'>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
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
									className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Título no Plugin
								</label>
								<input
									type='text'
									value={newManga.mangaFromPlugin.title}
									readOnly
									className='w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500'
								/>
							</div>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Plugin
								</label>
								<input
									type='text'
									value={newManga.plugin.name}
									readOnly
									className='w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500'
								/>
							</div>
						</div>
						<div className='mt-6 flex gap-3'>
							<button
								onClick={handleAddConfirm}
								disabled={!newManga.localTitle || addManga.isPending}
								className='rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50'
							>
								{addManga.isPending ? 'Adicionando...' : 'Adicionar'}
							</button>
							<button
								onClick={() => { setStep('list'); setListPluginFilter(''); }}
								className='rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
							>
								Cancelar
							</button>
						</div>
					</div>
				)}

			<ConfirmDialog
				open={pendingDelete !== null}
				title='Deletar manga'
				message={`Tem certeza que deseja deletar "${pendingDelete?.title}"?`}
				onConfirm={() => {
					if (pendingDelete) deleteManga.mutate(pendingDelete.title);
					setPendingDelete(null);
				}}
				onCancel={() => setPendingDelete(null)}
			/>
		</div>
	);
}
