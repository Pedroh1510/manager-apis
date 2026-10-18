import { useState } from 'react';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useServerConfig } from '../../server-config/hooks/useServerConfig';
import { SeasonFilters } from '../components/SeasonFilters';
import { SeasonNavigation } from '../components/SeasonNavigation';
import { SeasonResults } from '../components/SeasonResults';
import { useAnimeSeason } from '../hooks/useAnimeSeason';
import { useSeasonParams } from '../hooks/useSeasonParams';
import { filterSeasonItems } from '../lib/filterSeasonItems';
import type { SeasonTab } from '../lib/seasonParams';
import { seasonTitle } from '../lib/seasons';

const TABS: { tab: SeasonTab; label: string }[] = [{ tab: 'season', label: 'Temporada' }, { tab: 'upcoming', label: 'Anunciados' }];

function TabSwitch({ tab, onTab }: { tab: SeasonTab; onTab: (tab: SeasonTab) => void }) {
	return (
		<div role='group' aria-label='Lista' className='inline-flex rounded-md border border-border bg-surface p-0.5'>
			{TABS.map((option) => (
				<button key={option.tab} type='button' aria-pressed={option.tab === tab} onClick={() => onTab(option.tab)}
					className={`h-7 rounded px-3 text-xs font-medium transition-colors ${FOCUS_RING} ${option.tab === tab ? 'bg-surface-raised text-text' : 'text-text-muted hover:text-text'}`}>
					{option.label}
				</button>
			))}
		</div>
	);
}

/**
 * Anime by season from AniList: navigate seasons or the upcoming list, filter, sort, search, and jump to Sonarr.
 * @example <Route path='anime/temporadas' element={<AnimeSeasonPage />} />
 */
export function AnimeSeasonPage() {
	const { params, updateParams } = useSeasonParams();
	const [search, setSearch] = useState('');
	// Starts off on every visit and is never persisted (decision Q12).
	const [isAdultShown, setAdultShown] = useState(false);
	const list = useAnimeSeason(params);
	const isSonarrOn = useServerConfig().data?.sonarr === true;
	const isUpcoming = params.tab === 'upcoming';
	const sort = isUpcoming ? 'popularity' : params.sort;
	const allowed = (list.data?.items ?? []).filter((item) => isAdultShown || !item.isAdult);
	return (
		<div className='mx-auto max-w-screen-2xl space-y-4'>
			<PageHeader title={isUpcoming ? 'Anunciados' : seasonTitle(params)} actions={<TabSwitch tab={params.tab} onTab={(tab) => updateParams({ tab })} />} />
			{!isUpcoming && <SeasonNavigation value={params} onGo={({ year, season }) => updateParams({ year, season })} />}
			<SeasonFilters type={params.type} onType={(type) => updateParams({ type })} sort={isUpcoming ? null : params.sort} onSort={(value) => updateParams({ sort: value })}
				search={search} onSearch={setSearch} isAdultShown={isAdultShown} onAdultShown={setAdultShown} />
			<SeasonResults list={list} visibleItems={filterSeasonItems(allowed, search)} sort={sort} isUpcoming={isUpcoming} isSonarrOn={isSonarrOn} />
		</div>
	);
}
