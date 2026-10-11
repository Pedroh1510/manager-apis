import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { AddSeriesDrawer } from '../components/AddSeriesDrawer';
import { LookupCard } from '../components/LookupCard';
import { browserPrefsStorage, type PrefsStorage } from '../lib/addSeriesPrefs';
import { lookupSeries } from '../services/api';
import type { SeriesLookupResult } from '../services/types';

interface LookupResultsProps {
	term: string;
	addedIds: Record<number, number>;
	onSelect: (series: SeriesLookupResult) => void;
}

function LookupResults({ term, addedIds, onSelect }: LookupResultsProps) {
	const results = useQuery({ queryKey: ['sonarr', 'lookup', term], queryFn: () => lookupSeries(term), enabled: term.trim() !== '' });
	if (term.trim() === '') return null;
	if (results.isPending) return <LoadingSpinner />;
	if (results.isError) return <ErrorMessage message={getApiErrorMessage(results.error)} />;
	if (results.data.length === 0) return <p className='py-8 text-center text-sm text-text-muted'>Nenhuma série encontrada</p>;
	return (
		<ul className='grid gap-3 lg:grid-cols-2'>
			{results.data.map((series) => (
				<li key={series.tvdbId}>
					<LookupCard series={series} librarySeriesId={series.seriesId ?? addedIds[series.tvdbId] ?? null} onSelect={() => onSelect(series)} />
				</li>
			))}
		</ul>
	);
}

function SearchForm({ initialTerm, onSearch }: { initialTerm: string; onSearch: (term: string) => void }) {
	const [draft, setDraft] = useState(initialTerm);
	const submit = (event: FormEvent) => {
		event.preventDefault();
		onSearch(draft);
	};
	return (
		<form onSubmit={submit} className='flex gap-2'>
			<Input aria-label='Buscar série' placeholder='Nome da série' value={draft} onChange={(event) => setDraft(event.target.value)} className='w-72' />
			<Button type='submit'>Buscar</Button>
		</form>
	);
}

/**
 * Sonarr lookup and add form; stays on the results after adding so several series go in a row (decision A4).
 * @example <Route path='sonarr/adicionar' element={<AddSeriesPage />} />
 */
export function AddSeriesPage({ prefsStorage }: { prefsStorage?: PrefsStorage | null }) {
	const [search, setSearch] = useSearchParams();
	const [storage] = useState(() => (prefsStorage === undefined ? browserPrefsStorage() : prefsStorage));
	const [selected, setSelected] = useState<SeriesLookupResult | null>(null);
	const [addedIds, setAddedIds] = useState<Record<number, number>>({});
	const navigate = useNavigate();
	const toast = useToast();
	const queryClient = useQueryClient();
	const term = search.get('q') ?? '';

	const markAdded = (series: SeriesLookupResult, seriesId: number) => {
		setAddedIds((current) => ({ ...current, [series.tvdbId]: seriesId }));
		setSelected(null);
		toast.success(`${series.title} adicionada`, { label: 'Ver série', href: `/sonarr/${seriesId}`, onFollow: navigate });
		void queryClient.invalidateQueries({ queryKey: ['sonarr', 'series'] });
	};

	return (
		<div className='mx-auto max-w-5xl space-y-4'>
			<PageHeader title='Adicionar série' actions={<SearchForm initialTerm={term} onSearch={(value) => setSearch(value ? { q: value } : {}, { replace: true })} />} />
			<LookupResults term={term} addedIds={addedIds} onSelect={setSelected} />
			<AddSeriesDrawer series={selected} storage={storage} onClose={() => setSelected(null)} onAdded={markAdded} />
		</div>
	);
}
