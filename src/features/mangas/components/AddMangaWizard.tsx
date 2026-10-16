import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { CreateMangaWithConnectorPayload, MangaFromPlugin, Plugin } from '../services/types';
import { dedupeByTitle, pluginLabel } from '../lib/pluginCatalog';
import { labelCls, MangaStep, PluginStep } from './catalogSteps';

type Step = 'select-plugin' | 'select-manga' | 'confirm-add';

interface AddMangaWizardProps {
	isAdding: boolean;
	onAdd: (payload: CreateMangaWithConnectorPayload) => void;
	onCancel: () => void;
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
