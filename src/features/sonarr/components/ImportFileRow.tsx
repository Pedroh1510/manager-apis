import { useState } from 'react';
import { Td } from '../../../components/ui/Table';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { formatEpisodeList, type FileSelection } from '../lib/importSelection';
import { formatBytes } from '../lib/formatSeries';
import type { ImportCandidate, SeriesSummary } from '../services/types';
import { EpisodePicker } from './EpisodePicker';

const CONTROL = `h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text ${FOCUS_RING}`;
const COLUMNS = 3;

interface ImportFileRowProps {
	file: ImportCandidate;
	selection: FileSelection;
	series: SeriesSummary[];
	onChange: (selection: FileSelection) => void;
}

function FileFacts({ file }: { file: ImportCandidate }) {
	const facts = [formatBytes(file.size), file.quality, file.languages.join(', '), file.releaseGroup].filter(Boolean).join(' · ');
	return (
		<div className='min-w-0 space-y-1'>
			<p className='break-all text-sm font-medium text-text'>{file.relativePath}</p>
			<p className='font-mono text-xs text-text-muted'>{facts}</p>
			{file.rejections.length > 0 && (
				<ul className='space-y-0.5 text-xs text-danger'>
					{file.rejections.map((reason) => <li key={reason}>{reason}</li>)}
				</ul>
			)}
		</div>
	);
}

/**
 * One file of the download: checkbox, what Sonarr detected, and the series and episodes to import it as.
 * @example <ImportFileRow file={candidate} selection={selection[candidate.path]} series={library} onChange={update} />
 */
export function ImportFileRow({ file, selection, series, onChange }: ImportFileRowProps) {
	const [isPicking, setIsPicking] = useState(false);
	const name = file.relativePath;
	return (
		<>
			<tr>
				<Td className='w-8 align-top'>
					<input type='checkbox' aria-label={`Importar ${name}`} checked={selection.isChecked} onChange={() => onChange({ ...selection, isChecked: !selection.isChecked })} className={`h-4 w-4 accent-accent ${FOCUS_RING}`} />
				</Td>
				<Td className='align-top'>
					<FileFacts file={file} />
				</Td>
				<Td className='w-64 space-y-1.5 align-top'>
					<select
						aria-label={`Série de ${name}`}
						value={selection.seriesId ?? ''}
						onChange={(event) => onChange({ ...selection, seriesId: event.target.value ? Number(event.target.value) : null, episodes: [] })}
						className={CONTROL}
					>
						<option value=''>Escolha a série</option>
						{series.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
					</select>
					<div className='flex items-center justify-between gap-2 text-xs'>
						<span className='font-mono text-text'>{formatEpisodeList(selection.episodes)}</span>
						<button type='button' disabled={selection.seriesId === null} onClick={() => setIsPicking((open) => !open)} aria-label={`Escolher episódios de ${name}`} className={`rounded-sm font-medium text-accent hover:underline disabled:opacity-40 ${FOCUS_RING}`}>
							Episódios
						</button>
					</div>
				</Td>
			</tr>
			{isPicking && selection.seriesId !== null && (
				<tr>
					<Td colSpan={COLUMNS} className='bg-surface-raised'>
						<EpisodePicker label={`Episódios de ${name}`} seriesId={selection.seriesId} selected={selection.episodes} onChange={(episodes) => onChange({ ...selection, episodes })} />
					</Td>
				</tr>
			)}
		</>
	);
}
