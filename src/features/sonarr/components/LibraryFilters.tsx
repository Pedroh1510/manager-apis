import { FOCUS_RING } from '../../../components/ui/focusRing';
import type { StatusFilter } from '../hooks/useLibraryParams';
import { SERIES_SORTS, type SeriesSort } from '../lib/sortSeries';
import type { SeriesSummary } from '../services/types';

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
	{ value: 'all', label: 'Todas' },
	{ value: 'continuing', label: 'Continuando' },
	{ value: 'ended', label: 'Encerrada' },
	{ value: 'upcoming', label: 'Em breve' }
];

const selectCls = `h-8 rounded-md border border-border bg-surface px-2 text-sm text-text ${FOCUS_RING}`;

interface LibraryFiltersProps {
	series: SeriesSummary[];
	status: StatusFilter;
	sort: SeriesSort;
	onStatusChange: (status: StatusFilter) => void;
	onSortChange: (sort: SeriesSort) => void;
}

function countOf(series: SeriesSummary[], status: StatusFilter): number {
	return status === 'all' ? series.length : series.filter((item) => item.status === status).length;
}

/**
 * Status chips with their counts over the whole library, and the sort select.
 * @example <LibraryFilters series={data} status='all' sort='title' onStatusChange={...} onSortChange={...} />
 */
export function LibraryFilters({ series, status, sort, onStatusChange, onSortChange }: LibraryFiltersProps) {
	return (
		<div className='flex flex-wrap items-center justify-between gap-3'>
			<div role='group' aria-label='Status' className='inline-flex rounded-md border border-border bg-surface p-0.5'>
				{STATUS_OPTIONS.map((option) => (
					<button
						key={option.value}
						type='button'
						aria-pressed={option.value === status}
						onClick={() => onStatusChange(option.value)}
						className={`h-7 rounded-sm px-3 text-xs font-medium transition-colors ${FOCUS_RING} ${
							option.value === status ? 'bg-surface-raised text-text shadow-raised' : 'text-text-muted hover:text-text'
						}`}
					>
						{`${option.label} (${countOf(series, option.value)})`}
					</button>
				))}
			</div>
			<select aria-label='Ordenar por' value={sort} onChange={(event) => onSortChange(event.target.value as SeriesSort)} className={selectCls}>
				{SERIES_SORTS.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}
