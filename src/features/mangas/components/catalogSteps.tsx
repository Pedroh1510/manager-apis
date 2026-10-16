import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { usePlugins } from '../hooks/usePlugins';
import { fetchMangasByPlugin } from '../services/api';
import { pluginLabel } from '../lib/pluginCatalog';
import type { MangaFromPlugin, Plugin } from '../services/types';

const CATALOG_DOWNLOADING_MESSAGE =
	'Catálogo deste plugin ainda não foi baixado. O download começou — clique em Próximo novamente em alguns minutos.';
export const labelCls = 'mb-1 block text-xs font-medium text-text-muted';
const selectCls = `h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text ${FOCUS_RING}`;

const toPlugins = (list: Plugin[] | undefined) => (list ?? []).filter((p): p is Plugin => p != null);

interface PluginStepProps {
	plugin: Plugin | null;
	onPluginChange: (plugin: Plugin | null) => void;
	onCatalogReady: (list: MangaFromPlugin[]) => void;
	onCancel: () => void;
	excludedPluginIds?: string[];
}

/**
 * Plugin picker that loads the plugin catalog on "Próximo".
 * @example <PluginStep plugin={p} onPluginChange={setP} onCatalogReady={next} onCancel={close} excludedPluginIds={['tcb']} />
 */
export function PluginStep({ plugin, onPluginChange, onCatalogReady, onCancel, excludedPluginIds = [] }: PluginStepProps) {
	const { data } = usePlugins();
	const [pluginFilter, setPluginFilter] = useState('');
	const [loading, setLoading] = useState(false);
	const [catalogDownloading, setCatalogDownloading] = useState(false);
	const plugins = toPlugins(data).filter((p) => !excludedPluginIds.includes(p.id));
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

/**
 * Filterable list of a plugin's catalog.
 * @example <MangaStep pluginName='TCB' mangas={list} onChoose={pick} onBack={back} />
 */
export function MangaStep({ pluginName, mangas, onChoose, onBack }: MangaStepProps) {
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
