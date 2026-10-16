import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import type { LinkConnectorPayload, MangaFromPlugin, Plugin } from '../services/types';
import { dedupeByTitle, pluginLabel } from '../lib/pluginCatalog';
import { MangaStep, PluginStep } from './catalogSteps';

type Step = 'select-plugin' | 'select-manga' | 'confirm-link';

interface LinkConnectorWizardProps {
	mangaTitle: string;
	linkedPluginIds: string[];
	isLinking: boolean;
	onLink: (payload: LinkConnectorPayload) => void;
	onCancel: () => void;
}

/**
 * Plugin → manga from the plugin catalog → confirm, linking the entry to an
 * existing manga. Unlike AddMangaWizard it never creates a manga, so the
 * catalog title may differ from the local folder title.
 * @example <LinkConnectorWizard mangaTitle='Naruto' linkedPluginIds={['tcb']} isLinking={false} onLink={link} onCancel={close} />
 */
export function LinkConnectorWizard({ mangaTitle, linkedPluginIds, isLinking, onLink, onCancel }: LinkConnectorWizardProps) {
	const [step, setStep] = useState<Step>('select-plugin');
	const [plugin, setPlugin] = useState<Plugin | null>(null);
	const [mangaFromPlugin, setMangaFromPlugin] = useState<MangaFromPlugin | null>(null);
	const [available, setAvailable] = useState<MangaFromPlugin[]>([]);

	if (step === 'select-plugin') {
		return (
			<PluginStep
				plugin={plugin}
				onPluginChange={setPlugin}
				excludedPluginIds={linkedPluginIds}
				onCatalogReady={(list) => {
					setAvailable(dedupeByTitle(list));
					setStep('select-manga');
				}}
				onCancel={onCancel}
			/>
		);
	}
	if (step === 'select-manga' || !plugin || !mangaFromPlugin) {
		const choose = (manga: MangaFromPlugin) => {
			setMangaFromPlugin(manga);
			setStep('confirm-link');
		};
		return <MangaStep pluginName={plugin ? pluginLabel(plugin) : ''} mangas={available} onChoose={choose} onBack={() => setStep('select-plugin')} />;
	}
	return (
		<ConfirmLinkStep
			mangaTitle={mangaTitle}
			plugin={plugin}
			mangaFromPlugin={mangaFromPlugin}
			isLinking={isLinking}
			onConfirm={() => onLink({ idPlugin: plugin.id, idMangaPlugin: mangaFromPlugin.id, titlePlugin: mangaFromPlugin.title })}
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
