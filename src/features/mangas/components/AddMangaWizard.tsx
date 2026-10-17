import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { CreateMangaWithConnectorPayload, MangaFromPlugin, Plugin } from '../services/types';
import type { CatalogEntry, LoadedCatalogs } from '../lib/catalogLoader';
import { pluginLabel } from '../lib/pluginCatalog';
import { catalogCoverUrl } from '../services/coverUrls';
import { ALL_PLUGINS, type PluginChoice } from '../lib/pluginChoice';
import { labelCls, PluginStep } from './catalogSteps';
import { MangaCover } from './MangaCover';
import { MangaStep } from './MangaStep';

type Step = 'select-plugin' | 'select-manga' | 'confirm-add';

interface AddMangaWizardProps {
	isAdding: boolean;
	onAdd: (payload: CreateMangaWithConnectorPayload) => void;
	onCancel: () => void;
}

/**
 * Plugin (or all of them) → manga from the catalog → local title. The page
 * owns the mutation and closes the drawer once it succeeds.
 * @example <AddMangaWizard isAdding={addManga.isPending} onAdd={addManga.mutate} onCancel={close} />
 */
export function AddMangaWizard({ isAdding, onAdd, onCancel }: AddMangaWizardProps) {
	const [step, setStep] = useState<Step>('select-plugin');
	const [choice, setChoice] = useState<PluginChoice>(ALL_PLUGINS);
	const [catalog, setCatalog] = useState<LoadedCatalogs | null>(null);
	const [entry, setEntry] = useState<CatalogEntry | null>(null);
	const [localTitle, setLocalTitle] = useState('');

	function chooseEntry(chosen: CatalogEntry) {
		setEntry(chosen);
		setLocalTitle(chosen.manga.title);
		setStep('confirm-add');
	}

	if (step === 'select-plugin' || !catalog) {
		return (
			<PluginStep
				choice={choice}
				onChoiceChange={setChoice}
				onCatalogReady={(loaded) => {
					setCatalog(loaded);
					setStep('select-manga');
				}}
				onCancel={onCancel}
			/>
		);
	}
	if (step === 'select-manga' || !entry) {
		return <MangaStep choice={choice} catalog={catalog} onChoose={chooseEntry} onBack={() => setStep('select-plugin')} />;
	}
	const { plugin, manga } = entry;
	return (
		<ConfirmStep
			plugin={plugin}
			mangaFromPlugin={manga}
			localTitle={localTitle}
			onLocalTitleChange={setLocalTitle}
			isAdding={isAdding}
			onConfirm={() => onAdd({ title: localTitle, idPlugin: plugin.id, idMangaPlugin: manga.id, titlePlugin: manga.title })}
			onCancel={onCancel}
		/>
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
			<MangaCover src={catalogCoverUrl(plugin.id, mangaFromPlugin.id)} title={mangaFromPlugin.title} width={180} height={255} />
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
