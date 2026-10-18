import type { UseQueryResult } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { getApiErrorMessage } from '../../../lib/apiError';
import { WEEKDAY_LONG } from '../lib/formatSeasonCard';
import type { SeasonSort } from '../lib/seasonParams';
import { groupByWeekday, sortSeasonItems } from '../lib/sortSeasonItems';
import type { AnimeSeasonItem, AnimeSeasonList } from '../services/types';
import { AnimeSeasonCard } from './AnimeSeasonCard';

interface SeasonResultsProps {
	list: UseQueryResult<AnimeSeasonList>;
	/** After the adult filter and the search. */
	visibleItems: AnimeSeasonItem[];
	sort: SeasonSort;
	isUpcoming: boolean;
	isSonarrOn: boolean;
}

const SKELETON_COUNT = 12;
const GRID_CLS = 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
const emptyCls = 'py-12 text-center text-sm text-text-muted';

function SkeletonGrid() {
	return (
		<div className={GRID_CLS} aria-busy='true'>
			{Array.from({ length: SKELETON_COUNT }, (_, index) => (
				<div key={index} data-testid='season-card-skeleton' className='animate-pulse overflow-hidden rounded-lg border border-border bg-surface'>
					<div className='aspect-[2/3] bg-surface-raised' />
					<div className='space-y-2 p-2.5'><div className='h-3 w-3/4 rounded bg-surface-raised' /><div className='h-3 w-1/2 rounded bg-surface-raised' /></div>
				</div>
			))}
		</div>
	);
}

function CardGrid({ items, isUpcoming, isSonarrOn }: { items: AnimeSeasonItem[]; isUpcoming: boolean; isSonarrOn: boolean }) {
	return (
		<div data-testid='season-grid' className={GRID_CLS}>
			{items.map((item) => <AnimeSeasonCard key={item.malId} item={item} isUpcoming={isUpcoming} isSonarrOn={isSonarrOn} />)}
		</div>
	);
}

function WeekdayBlocks({ items, isSonarrOn }: { items: AnimeSeasonItem[]; isSonarrOn: boolean }) {
	return (
		<div className='space-y-6'>
			{groupByWeekday(items).map(({ day, items: dayItems }) => (
				<section key={day ?? 'none'} aria-label={day ? WEEKDAY_LONG[day] : 'Sem dia definido'}>
					<h2 className='mb-2 text-xs font-semibold uppercase tracking-wider text-text-subtle'>{day ? WEEKDAY_LONG[day] : 'Sem dia definido'}</h2>
					<CardGrid items={dayItems} isUpcoming={false} isSonarrOn={isSonarrOn} />
				</section>
			))}
		</div>
	);
}

/**
 * Loading, error, empty, truncated notice and the grid (plain or by weekday) of the season screen.
 * @example <SeasonResults list={list} visibleItems={items} sort='popularity' isUpcoming={false} isSonarrOn />
 */
export function SeasonResults({ list, visibleItems, sort, isUpcoming, isSonarrOn }: SeasonResultsProps) {
	if (list.isPending) return <SkeletonGrid />;
	if (list.isError) {
		return (
			<div className='space-y-3'>
				<ErrorMessage message={getApiErrorMessage(list.error)} />
				<Button onClick={() => void list.refetch()}>Tentar de novo</Button>
			</div>
		);
	}
	if (list.data.items.length === 0) return <p className={emptyCls}>Nenhum anime nesta temporada</p>;
	return (
		<div className='space-y-3'>
			{list.data.truncated && <p className='text-xs text-text-muted'>Mostrando os primeiros {list.data.items.length} anunciados</p>}
			{visibleItems.length === 0 && <p className={emptyCls}>Nenhum anime encontrado</p>}
			{visibleItems.length > 0 && sort === 'weekday' && <WeekdayBlocks items={visibleItems} isSonarrOn={isSonarrOn} />}
			{visibleItems.length > 0 && sort !== 'weekday' && <CardGrid items={sortSeasonItems(visibleItems, sort)} isUpcoming={isUpcoming} isSonarrOn={isSonarrOn} />}
		</div>
	);
}
