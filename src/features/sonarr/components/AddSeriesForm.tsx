import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '../../../components/ui/Button';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import type { AddSeriesPrefs } from '../lib/addSeriesPrefs';
import { MONITOR_OPTIONS, SERIES_TYPE_OPTIONS } from '../lib/seriesType';
import type { AddOptions, MonitorOption, SeriesType } from '../services/types';

export interface AddSeriesChoices extends AddSeriesPrefs {
	seriesType: SeriesType;
}

const SELECT = `h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text ${FOCUS_RING}`;

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<label className='block space-y-1 text-xs font-medium text-text-muted'>
			<span>{label}</span>
			{children}
		</label>
	);
}

interface AddSeriesFormProps {
	options: AddOptions;
	initial: AddSeriesChoices;
	isSubmitting: boolean;
	onSubmit: (choices: AddSeriesChoices) => void;
}

/**
 * Profile, folder, type, what to monitor and "search on add"; starts from `initial`.
 * @example <AddSeriesForm options={options} initial={defaults} isSubmitting={false} onSubmit={add} />
 */
export function AddSeriesForm({ options, initial, isSubmitting, onSubmit }: AddSeriesFormProps) {
	const [choices, setChoices] = useState(initial);
	const set = <K extends keyof AddSeriesChoices>(key: K, value: AddSeriesChoices[K]) => setChoices((current) => ({ ...current, [key]: value }));
	const submit = (event: FormEvent) => {
		event.preventDefault();
		onSubmit(choices);
	};
	return (
		<form onSubmit={submit} className='space-y-4'>
			<Field label='Quality profile'>
				<select className={SELECT} value={choices.qualityProfileId} onChange={(event) => set('qualityProfileId', Number(event.target.value))}>
					{options.qualityProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
				</select>
			</Field>
			<Field label='Pasta raiz'>
				<select className={SELECT} value={choices.rootFolderPath} onChange={(event) => set('rootFolderPath', event.target.value)}>
					{options.rootFolders.map((folder) => <option key={folder.path} value={folder.path}>{folder.path}</option>)}
				</select>
			</Field>
			<Field label='Tipo'>
				<select className={SELECT} value={choices.seriesType} onChange={(event) => set('seriesType', event.target.value as SeriesType)}>
					{SERIES_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
				</select>
			</Field>
			<Field label='Monitorar'>
				<select className={SELECT} value={choices.monitor} onChange={(event) => set('monitor', event.target.value as MonitorOption)}>
					{MONITOR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
				</select>
			</Field>
			<label className='flex items-center gap-2 text-sm text-text'>
				<input
					type='checkbox'
					checked={choices.searchForMissingEpisodes}
					onChange={(event) => set('searchForMissingEpisodes', event.target.checked)}
					className={`h-4 w-4 rounded border-border accent-accent ${FOCUS_RING}`}
				/>
				Buscar faltantes ao adicionar
			</label>
			<Button type='submit' variant='primary' disabled={isSubmitting} className='w-full'>
				Adicionar
			</Button>
		</form>
	);
}
