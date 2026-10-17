import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { catalogNotices, type CatalogEntry, type LoadedCatalogs } from '../lib/catalogLoader';
import { CatalogMangaItem } from './CatalogMangaItem';
import { CatalogNotices } from './CatalogNotices';
import { ALL_PLUGINS, choiceLabel, type PluginChoice } from '../lib/pluginChoice';

interface MangaStepProps {
	choice: PluginChoice;
	catalog: LoadedCatalogs;
	onChoose: (entry: CatalogEntry) => void;
	onBack: () => void;
}

/**
 * Filterable list of the loaded catalogs; with "Todos os plugins" each row
 * shows the plugin it came from.
 * @example <MangaStep choice={ALL_PLUGINS} catalog={loaded} onChoose={pick} onBack={back} />
 */
export function MangaStep({ choice, catalog, onChoose, onBack }: MangaStepProps) {
	const [filter, setFilter] = useState('');
	const isAllPlugins = choice === ALL_PLUGINS;
	const visible = catalog.entries.filter(({ manga }) => !filter || manga.title.toLowerCase().includes(filter.toLowerCase()));
	return (
		<section className='space-y-3'>
			<h3 className='text-sm font-semibold text-text'>
				Selecione um mangá <span className='font-normal text-text-muted'>({choiceLabel(choice)})</span>
			</h3>
			<CatalogNotices notices={catalogNotices(catalog, isAllPlugins)} />
			<Input placeholder='Filtrar manga por título...' value={filter} onChange={(e) => setFilter(e.target.value)} />
			{visible.length === 0 && <p className='text-xs text-text-muted'>Nenhum mangá disponível.</p>}
			<ul className='max-h-[60vh] divide-y divide-border overflow-y-auto rounded-md border border-border'>
				{visible.map((entry) => (
					<CatalogMangaItem
						// Titles are deduped per plugin, so plugin + title is unique.
						key={`${entry.plugin.id}:${entry.manga.title}`}
						entry={entry}
						showPluginBadge={isAllPlugins}
						onChoose={onChoose}
					/>
				))}
			</ul>
			<Button variant='ghost' onClick={onBack}>
				Voltar
			</Button>
		</section>
	);
}
