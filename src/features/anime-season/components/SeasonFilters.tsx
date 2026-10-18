import { FOCUS_RING } from '../../../components/ui/focusRing';
import { Input } from '../../../components/ui/Input';
import { Toggle } from '../../../components/ui/Toggle';
import type { SeasonSort } from '../lib/seasonParams';
import type { AnimeType } from '../services/types';

interface SeasonFiltersProps {
	type: AnimeType;
	onType: (type: AnimeType) => void;
	/** null hides the sort picker (upcoming sorts by popularity only). */
	sort: SeasonSort | null;
	onSort: (sort: SeasonSort) => void;
	search: string;
	onSearch: (search: string) => void;
	isAdultShown: boolean;
	onAdultShown: (isShown: boolean) => void;
}

const TYPE_CHIPS: { type: AnimeType; label: string }[] = [
	{ type: 'tv', label: 'TV' }, { type: 'ona', label: 'ONA' }, { type: 'movie', label: 'Filme' }, { type: 'ova', label: 'OVA' }, { type: 'special', label: 'Especial' }
];

const SORT_LABELS: Record<SeasonSort, string> = { popularity: 'Popularidade', score: 'Score', weekday: 'Dia de exibição' };

const chipCls = (isActive: boolean) =>
	`h-7 rounded-full border px-3 text-xs font-medium transition-colors ${FOCUS_RING} ${isActive ? 'border-accent bg-accent text-white' : 'border-border bg-surface text-text-muted hover:text-text'}`;

function TypeChips({ type, onType }: Pick<SeasonFiltersProps, 'type' | 'onType'>) {
	return (
		<div role='group' aria-label='Tipo' className='flex flex-wrap gap-1.5'>
			{TYPE_CHIPS.map((chip) => (
				<button key={chip.type} type='button' aria-pressed={chip.type === type} className={chipCls(chip.type === type)} onClick={() => onType(chip.type)}>
					{chip.label}
				</button>
			))}
		</div>
	);
}

/**
 * Type chips, sort, title search and the adult toggle of the season screen.
 * @example <SeasonFilters type='tv' onType={setType} sort='popularity' ... />
 */
export function SeasonFilters({ type, onType, sort, onSort, search, onSearch, isAdultShown, onAdultShown }: SeasonFiltersProps) {
	return (
		<div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
			<TypeChips type={type} onType={onType} />
			{sort && (
				<select aria-label='Ordenar por' value={sort} onChange={(event) => onSort(event.target.value as SeasonSort)}
					className={`h-8 rounded-md border border-border bg-surface px-2 text-sm text-text ${FOCUS_RING}`}>
					{(Object.keys(SORT_LABELS) as SeasonSort[]).map((value) => <option key={value} value={value}>{SORT_LABELS[value]}</option>)}
				</select>
			)}
			<Input type='search' aria-label='Buscar anime' placeholder='Buscar por título' value={search} onChange={(event) => onSearch(event.target.value)} className='w-56' />
			<Toggle checked={isAdultShown} onChange={onAdultShown} label='Mostrar conteúdo adulto' showLabel />
		</div>
	);
}
