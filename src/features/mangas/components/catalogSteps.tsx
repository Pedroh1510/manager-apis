import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { usePlugins } from '../hooks/usePlugins';
import { fetchMangasByPlugin } from '../services/api';
import { catalogNotices, loadCatalogs, type LoadedCatalogs } from '../lib/catalogLoader';
import { pluginLabel } from '../lib/pluginCatalog';
import type { Plugin } from '../services/types';
import { ALL_PLUGINS, ALL_PLUGINS_LABEL, type PluginChoice } from '../lib/pluginChoice';
import { CatalogNotices } from './CatalogNotices';

export const labelCls = 'mb-1 block text-xs font-medium text-text-muted';
const selectCls = `h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text ${FOCUS_RING}`;

const ALL_PLUGINS_OPTION = '__all__';

const toPlugins = (list: Plugin[] | undefined) => (list ?? []).filter((p): p is Plugin => p != null);

interface PluginStepProps {
	choice: PluginChoice;
	onChoiceChange: (choice: PluginChoice) => void;
	onCatalogReady: (catalog: LoadedCatalogs) => void;
	onCancel: () => void;
	excludedPluginIds?: string[];
}

/**
 * Plugin picker ("Todos os plugins" or one plugin) that loads the catalogs on
 * "Próximo". It only stays here when nothing loaded and some plugin is still
 * downloading or failed; otherwise the warnings travel with the catalog.
 * @example <PluginStep choice={c} onChoiceChange={setC} onCatalogReady={next} onCancel={close} excludedPluginIds={['tcb']} />
 */
export function PluginStep({ choice, onChoiceChange, onCatalogReady, onCancel, excludedPluginIds = [] }: PluginStepProps) {
	const { data } = usePlugins();
	const [pluginFilter, setPluginFilter] = useState('');
	const [loading, setLoading] = useState(false);
	const [notices, setNotices] = useState<string[]>([]);
	const plugins = toPlugins(data).filter((p) => !excludedPluginIds.includes(p.id));
	const visible = plugins.filter((p) => !pluginFilter || pluginLabel(p).toLowerCase().includes(pluginFilter.toLowerCase()));
	const targets = choice === ALL_PLUGINS ? plugins : [choice];

	async function loadCatalog() {
		setLoading(true);
		try {
			const loaded = await loadCatalogs(targets, fetchMangasByPlugin);
			const warnings = catalogNotices(loaded, choice === ALL_PLUGINS);
			if (loaded.entries.length > 0 || warnings.length === 0) return onCatalogReady(loaded);
			setNotices(warnings);
		} finally {
			setLoading(false);
		}
	}

	return (
		<section className='space-y-4'>
			<h3 className='text-sm font-semibold text-text'>Selecione um plugin</h3>
			<CatalogNotices notices={notices} />
			<div>
				<label htmlFor='new-manga-plugin' className={labelCls}>
					Plugin
				</label>
				<Input placeholder='Filtrar plugin...' value={pluginFilter} onChange={(e) => setPluginFilter(e.target.value)} className='mb-1.5' />
				<PluginSelect choice={choice} plugins={plugins} visible={visible} onChoiceChange={onChoiceChange} />
			</div>
			{loading && <LoadingSpinner />}
			<div className='flex gap-2'>
				<Button variant='primary' onClick={loadCatalog} disabled={targets.length === 0 || loading}>
					Próximo
				</Button>
				<Button variant='ghost' onClick={onCancel}>
					Cancelar
				</Button>
			</div>
		</section>
	);
}

interface PluginSelectProps {
	choice: PluginChoice;
	plugins: Plugin[];
	visible: Plugin[];
	onChoiceChange: (choice: PluginChoice) => void;
}

// "Todos os plugins" ignores the plugin filter so it is always one click away.
function PluginSelect({ choice, plugins, visible, onChoiceChange }: PluginSelectProps) {
	const toChoice = (value: string): PluginChoice => plugins.find((p) => p.id === value) ?? ALL_PLUGINS;
	return (
		<select
			id='new-manga-plugin'
			value={choice === ALL_PLUGINS ? ALL_PLUGINS_OPTION : choice.id}
			onChange={(e) => onChoiceChange(toChoice(e.target.value))}
			className={selectCls}
		>
			<option value={ALL_PLUGINS_OPTION}>{ALL_PLUGINS_LABEL}</option>
			{visible.map((p) => (
				<option key={p.id} value={p.id}>
					{pluginLabel(p)}
				</option>
			))}
		</select>
	);
}
