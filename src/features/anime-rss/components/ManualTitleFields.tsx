import type { RefObject } from 'react';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { Input } from '../../../components/ui/Input';
import type { ManualTitleFields as ManualTitleFieldsState } from '../hooks/useManualTitleFields';
import { exceedsTitleLimit, MANUAL_TITLE_MAX_LENGTH, VIDEO_CODECS, VIDEO_FORMATS, type VideoCodec, type VideoFormat } from '../lib/manualRssTitle';

const DUPLICATE_MESSAGE = 'Já existe item com esse título';
const EMPTY_OPTION = '';
const labelCls = 'mb-1 block text-xs font-medium text-text-muted';
const selectCls = `h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text ${FOCUS_RING}`;

interface ManualTitleFieldsProps {
	fields: ManualTitleFieldsState;
	isDuplicate: boolean;
	titleRef: RefObject<HTMLInputElement | null>;
	episodeRef: RefObject<HTMLInputElement | null>;
}

/**
 * Title inputs of the manual RSS item: free title plus season/episode/format/codec, with a live preview.
 * @example <ManualTitleFields fields={fields} isDuplicate={false} titleRef={titleRef} episodeRef={episodeRef} />
 */
export function ManualTitleFields({ fields, isDuplicate, titleRef, episodeRef }: ManualTitleFieldsProps) {
	return (
		<>
			<TitleOnlyCheckbox fields={fields} />
			<TitleInput fields={fields} isDuplicate={isDuplicate} titleRef={titleRef} />
			{!fields.values.isTitleOnly && <EpisodeInputs fields={fields} episodeRef={episodeRef} />}
			<TitlePreview composedTitle={fields.composedTitle} />
		</>
	);
}

function TitleOnlyCheckbox({ fields }: { fields: ManualTitleFieldsState }) {
	return (
		<label className='inline-flex items-center gap-2 text-xs text-text-muted'>
			<input
				type='checkbox'
				checked={fields.values.isTitleOnly}
				onChange={(e) => fields.update({ isTitleOnly: e.target.checked })}
				className={`h-3.5 w-3.5 rounded-sm border-border accent-accent ${FOCUS_RING}`}
			/>
			Somente título
		</label>
	);
}

function TitleInput({ fields, isDuplicate, titleRef }: Omit<ManualTitleFieldsProps, 'episodeRef'>) {
	return (
		<div>
			<label htmlFor='rss-item-title' className={labelCls}>
				Título
			</label>
			<Input
				id='rss-item-title'
				ref={titleRef}
				value={fields.values.title}
				onChange={(e) => fields.update({ title: e.target.value })}
				placeholder='Sousou no Frieren'
				aria-invalid={isDuplicate}
				aria-describedby={isDuplicate ? 'rss-item-title-error' : undefined}
			/>
			{isDuplicate && (
				<p id='rss-item-title-error' className='mt-1 text-xs text-danger'>
					{DUPLICATE_MESSAGE}
				</p>
			)}
		</div>
	);
}

function EpisodeInputs({ fields, episodeRef }: Pick<ManualTitleFieldsProps, 'fields' | 'episodeRef'>) {
	const { values, update } = fields;
	return (
		<div className='grid grid-cols-2 gap-3'>
			<NumberField id='rss-item-season' label='Temporada' min={0} value={values.season} onChange={(season) => update({ season })} />
			<NumberField
				id='rss-item-episode'
				label='Episódio'
				min={1}
				value={values.episode}
				onChange={(episode) => update({ episode })}
				inputRef={episodeRef}
			/>
			<SelectField id='rss-item-format' label='Formato' value={values.format} options={VIDEO_FORMATS} onChange={(v) => update({ format: v as VideoFormat })} />
			<SelectField
				id='rss-item-codec'
				label='Codec'
				value={values.codec ?? EMPTY_OPTION}
				options={VIDEO_CODECS}
				emptyLabel='—'
				onChange={(v) => update({ codec: v === EMPTY_OPTION ? null : (v as VideoCodec) })}
			/>
		</div>
	);
}

interface NumberFieldProps {
	id: string;
	label: string;
	min: number;
	value: string;
	onChange: (value: string) => void;
	inputRef?: RefObject<HTMLInputElement | null>;
}

function NumberField({ id, label, min, value, onChange, inputRef }: NumberFieldProps) {
	return (
		<div>
			<label htmlFor={id} className={labelCls}>
				{label}
			</label>
			<Input id={id} ref={inputRef} type='number' min={min} step={1} value={value} onChange={(e) => onChange(e.target.value)} />
		</div>
	);
}

interface SelectFieldProps {
	id: string;
	label: string;
	value: string;
	options: readonly string[];
	emptyLabel?: string;
	onChange: (value: string) => void;
}

function SelectField({ id, label, value, options, emptyLabel, onChange }: SelectFieldProps) {
	return (
		<div>
			<label htmlFor={id} className={labelCls}>
				{label}
			</label>
			<select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
				{emptyLabel !== undefined && <option value={EMPTY_OPTION}>{emptyLabel}</option>}
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</div>
	);
}

function TitlePreview({ composedTitle }: { composedTitle: string | null }) {
	return (
		<div>
			<p className={labelCls}>Título final</p>
			<p data-testid='rss-item-title-preview' className='break-all rounded-md border border-border bg-surface-raised px-2.5 py-1.5 font-mono text-xs text-text'>
				{composedTitle ?? '—'}
			</p>
			{exceedsTitleLimit(composedTitle) && (
				<p className='mt-1 text-xs text-danger'>
					Título final excede {MANUAL_TITLE_MAX_LENGTH} caracteres ({composedTitle?.length})
				</p>
			)}
		</div>
	);
}
