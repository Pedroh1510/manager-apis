import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { usePlugins } from '../hooks/usePlugins';
import { fetchMangasByPlugin } from '../services/api';
import type { CreateMangaWithConnectorPayload, MangaFromPlugin, Plugin } from '../services/types';

const CATALOG_DOWNLOADING_MESSAGE =
	'Catálogo deste plugin ainda não foi baixado. O download começou — clique em Próximo novamente em alguns minutos.';
const labelCls = 'mb-1 block text-xs font-medium text-text-muted';
const selectCls = `h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text ${FOCUS_RING}`;

type Step = 'select-plugin' | 'select-manga' | 'confirm-add';

interface AddMangaWizardProps {
	isAdding: boolean;
	onAdd: (payload: CreateMangaWithConnectorPayload) => void;
	onCancel: () => void;
}

const toPlugins = (list: Plugin[] | undefined) => (list ?? []).filter((p): p is Plugin => p != null);
const pluginLabel = (plugin: Plugin) => plugin.name || plugin.id;

function dedupeByTitle(list: MangaFromPlugin[]): MangaFromPlugin[] {
	const seen = new Set<string>();
	return list.filter((manga) => {
		if (seen.has(manga.title)) return false;
		seen.add(manga.title);
		return true;
	});
}

/**
 * Plugin → manga from the plugin catalog → local title. The page owns the
 * mutation and closes the drawer once it succeeds.
 * @example <AddMangaWizard isAdding={addManga.isPending} onAdd={addManga.mutate} onCancel={close} />
 */
export function AddMangaWizard({ isAdding, onAdd, onCancel }: AddMangaWizardProps) {
	const [step, setStep] = useState<Step>('select-plugin');
	const [plugin, setPlugin] = useState<Plugin | null>(null);
	const [mangaFromPlugin, setMangaFromPlugin] = useState<MangaFromPlugin | null>(null);
	const [localTitle, setLocalTitle] = useState('');
	const [available, setAvailable] = useState<MangaFromPlugin[]>([]);

	function chooseManga(manga: MangaFromPlugin) {
		setMangaFromPlugin(manga);
		setLocalTitle(manga.title);
		setStep('confirm-add');
	}

	if (step === 'select-plugin') {
		return (
			<PluginStep
				plugin={plugin}
				onPluginChange={setPlugin}
				onCatalogReady={(list) => {
					setAvailable(dedupeByTitle(list));
					setStep('select-manga');
				}}
				onCancel={onCancel}
			/>
		);
	}
	if (step === 'select-manga' || !plugin || !mangaFromPlugin) {
		return <MangaStep pluginName={plugin ? pluginLabel(plugin) : ''} mangas={available} onChoose={chooseManga} onBack={() => setStep('select-plugin')} />;
	}
	return (
		<ConfirmStep
			plugin={plugin}
			mangaFromPlugin={mangaFromPlugin}
			localTitle={localTitle}
			onLocalTitleChange={setLocalTitle}
			isAdding={isAdding}
			onConfirm={() =>
				onAdd({ title: localTitle, idPlugin: plugin.id, idMangaPlugin: mangaFromPlugin.id, titlePlugin: mangaFromPlugin.title })
			}
			onCancel={onCancel}
		/>
	);
}

interface PluginStepProps {
	plugin: Plugin | null;
	onPluginChange: (plugin: Plugin | null) => void;
	onCatalogReady: (list: MangaFromPlugin[]) => void;
	onCancel: () => void;
}

function PluginStep({ plugin, onPluginChange, onCatalogReady, onCancel }: PluginStepProps) {
	const { data } = usePlugins();
	const [pluginFilter, setPluginFilter] = useState('');
	const [loading, setLoading] = useState(false);
	const [catalogDownloading, setCatalogDownloading] = useState(false);
	const plugins = toPlugins(data);
	const visible = plugins.filter((p) => !pluginFilter || pluginLabel(p).toLowerCase().includes(pluginFilter.toLowerCase()));

	async function loadCatalog() {
		if (!plugin) return;
		setLoading(true);
		try {
			const list = await fetchMangasByPlugin(plugin.id);
			setCatalogDownloading(list === null);
			if (list !== null) onCatalogReady(list);
		} finally {
			setLoading(false);
		}
	}

	return (
		<section className='space-y-4'>
			<h3 className='text-sm font-semibold text-text'>Selecione um plugin</h3>
			{catalogDownloading && (
				<p role='status' className='rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning'>
					{CATALOG_DOWNLOADING_MESSAGE}
				</p>
			)}
			<div>
				<label htmlFor='new-manga-plugin' className={labelCls}>
					Plugin
				</label>
				<Input placeholder='Filtrar plugin...' value={pluginFilter} onChange={(e) => setPluginFilter(e.target.value)} className='mb-1.5' />
				<select
					id='new-manga-plugin'
					value={plugin?.id ?? ''}
					onChange={(e) => onPluginChange(plugins.find((p) => p.id === e.target.value) ?? null)}
					className={selectCls}
				>
					<option value=''>Escolha um plugin</option>
					{visible.map((p) => (
						<option key={p.id} value={p.id}>
							{pluginLabel(p)}
						</option>
					))}
				</select>
			</div>
			{loading && <LoadingSpinner />}
			<div className='flex gap-2'>
				<Button variant='primary' onClick={loadCatalog} disabled={!plugin || loading}>
					Próximo
				</Button>
				<Button variant='ghost' onClick={onCancel}>
					Cancelar
				</Button>
			</div>
		</section>
	);
}

interface MangaStepProps {
	pluginName: string;
	mangas: MangaFromPlugin[];
	onChoose: (manga: MangaFromPlugin) => void;
	onBack: () => void;
}

function MangaStep({ pluginName, mangas, onChoose, onBack }: MangaStepProps) {
	const [filter, setFilter] = useState('');
	const visible = mangas.filter((m) => !filter || m.title.toLowerCase().includes(filter.toLowerCase()));
	return (
		<section className='space-y-3'>
			<h3 className='text-sm font-semibold text-text'>
				Selecione um mangá <span className='font-normal text-text-muted'>({pluginName})</span>
			</h3>
			<Input placeholder='Filtrar manga por título...' value={filter} onChange={(e) => setFilter(e.target.value)} />
			{visible.length === 0 && <p className='text-xs text-text-muted'>Nenhum mangá disponível.</p>}
			<ul className='max-h-[60vh] divide-y divide-border overflow-y-auto rounded-md border border-border'>
				{visible.map((manga) => (
					<li key={manga.title}>
						<button
							onClick={() => onChoose(manga)}
							className={`w-full px-3 py-2 text-left text-sm text-text transition-colors hover:bg-surface-raised ${FOCUS_RING}`}
						>
							{manga.title}
						</button>
					</li>
				))}
			</ul>
			<Button variant='ghost' onClick={onBack}>
				Voltar
			</Button>
		</section>
	);
}

interface ConfirmStepProps {
	plugin: Plugin;
	mangaFromPlugin: MangaFromPlugin;
	localTitle: string;
	onLocalTitleChange: (title: string) => void;
	isAdding: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

function ConfirmStep({ plugin, mangaFromPlugin, localTitle, onLocalTitleChange, isAdding, onConfirm, onCancel }: ConfirmStepProps) {
	return (
		<section className='space-y-4'>
			<h3 className='text-sm font-semibold text-text'>Confirmar</h3>
			<div>
				<label htmlFor='new-manga-title' className={labelCls}>
					Título (pasta local)
				</label>
				<Input id='new-manga-title' value={localTitle} onChange={(e) => onLocalTitleChange(e.target.value)} />
			</div>
			<dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md bg-surface-raised px-3 py-2 text-xs'>
				<dt className='text-text-subtle'>Título no plugin</dt>
				<dd className='text-text'>{mangaFromPlugin.title}</dd>
				<dt className='text-text-subtle'>Plugin</dt>
				<dd className='font-mono text-text'>{pluginLabel(plugin)}</dd>
			</dl>
			<div className='flex gap-2'>
				<Button variant='primary' onClick={onConfirm} disabled={!localTitle || isAdding}>
					{isAdding ? 'Adicionando...' : 'Adicionar'}
				</Button>
				<Button variant='secondary' onClick={onCancel}>
					Cancelar
				</Button>
			</div>
		</section>
	);
}
