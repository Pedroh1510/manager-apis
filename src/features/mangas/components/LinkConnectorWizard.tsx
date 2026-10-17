import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import type { LinkConnectorPayload, MangaFromPlugin, Plugin } from '../services/types';
import type { CatalogEntry, LoadedCatalogs } from '../lib/catalogLoader';
import { pluginLabel } from '../lib/pluginCatalog';
import { ALL_PLUGINS, type PluginChoice } from '../lib/pluginChoice';
import { PluginStep } from './catalogSteps';
import { MangaStep } from './MangaStep';

type Step = 'select-plugin' | 'select-manga' | 'confirm-link';

interface LinkConnectorWizardProps {
	mangaTitle: string;
	linkedPluginIds: string[];
	isLinking: boolean;
	onLink: (payload: LinkConnectorPayload) => void;
	onCancel: () => void;
}

/**
 * Plugin (or every plugin not linked yet) → manga from the catalog → confirm,
 * linking the entry to an existing manga. Unlike AddMangaWizard it never
 * creates a manga, so the catalog title may differ from the local folder title.
 * @example <LinkConnectorWizard mangaTitle='Naruto' linkedPluginIds={['tcb']} isLinking={false} onLink={link} onCancel={close} />
 */
export function LinkConnectorWizard({ mangaTitle, linkedPluginIds, isLinking, onLink, onCancel }: LinkConnectorWizardProps) {
	const [step, setStep] = useState<Step>('select-plugin');
	const [choice, setChoice] = useState<PluginChoice>(ALL_PLUGINS);
	const [catalog, setCatalog] = useState<LoadedCatalogs | null>(null);
	const [entry, setEntry] = useState<CatalogEntry | null>(null);

	if (step === 'select-plugin' || !catalog) {
		return (
			<PluginStep
				choice={choice}
				onChoiceChange={setChoice}
				excludedPluginIds={linkedPluginIds}
				onCatalogReady={(loaded) => {
					setCatalog(loaded);
					setStep('select-manga');
				}}
				onCancel={onCancel}
			/>
		);
	}
	if (step === 'select-manga' || !entry) {
		const choose = (chosen: CatalogEntry) => {
			setEntry(chosen);
			setStep('confirm-link');
		};
		return <MangaStep choice={choice} catalog={catalog} onChoose={choose} onBack={() => setStep('select-plugin')} />;
	}
	const { plugin, manga } = entry;
	return (
		<ConfirmLinkStep
			mangaTitle={mangaTitle}
			plugin={plugin}
			mangaFromPlugin={manga}
			isLinking={isLinking}
			onConfirm={() => onLink({ idPlugin: plugin.id, idMangaPlugin: manga.id, titlePlugin: manga.title })}
			onCancel={onCancel}
		/>
	);
}

interface ConfirmLinkStepProps {
	mangaTitle: string;
	plugin: Plugin;
	mangaFromPlugin: MangaFromPlugin;
	isLinking: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

function ConfirmLinkStep({ mangaTitle, plugin, mangaFromPlugin, isLinking, onConfirm, onCancel }: ConfirmLinkStepProps) {
	return (
		<section className='space-y-4'>
			<h3 className='text-sm font-semibold text-text'>Confirmar vínculo</h3>
			<dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md bg-surface-raised px-3 py-2 text-xs'>
				<dt className='text-text-subtle'>Mangá</dt>
				<dd className='text-text'>{mangaTitle}</dd>
				<dt className='text-text-subtle'>Título no plugin</dt>
				<dd className='text-text'>{mangaFromPlugin.title}</dd>
				<dt className='text-text-subtle'>Plugin</dt>
				<dd className='font-mono text-text'>{pluginLabel(plugin)}</dd>
			</dl>
			<div className='flex gap-2'>
				<Button variant='primary' onClick={onConfirm} disabled={isLinking}>
					{isLinking ? 'Vinculando...' : 'Vincular'}
				</Button>
				<Button variant='secondary' onClick={onCancel}>
					Cancelar
				</Button>
			</div>
		</section>
	);
}
