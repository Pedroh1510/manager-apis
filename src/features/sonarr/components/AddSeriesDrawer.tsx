import { useMutation, useQuery } from '@tanstack/react-query';
import { Drawer } from '../../../components/ui/Drawer';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { readAddSeriesPrefs, resolveAddSeriesDefaults, writeAddSeriesPrefs, type PrefsStorage } from '../lib/addSeriesPrefs';
import { suggestSeriesType } from '../lib/seriesType';
import { addSeries, fetchAddOptions } from '../services/api';
import type { SeriesLookupResult } from '../services/types';
import { AddSeriesForm, type AddSeriesChoices } from './AddSeriesForm';

interface AddSeriesPanelProps {
	series: SeriesLookupResult;
	storage: PrefsStorage | null;
	onAdded: (seriesId: number) => void;
}

function AddSeriesPanel({ series, storage, onAdded }: AddSeriesPanelProps) {
	const toast = useToast();
	const options = useQuery({ queryKey: ['sonarr', 'add-options'], queryFn: fetchAddOptions });
	const add = useMutation({
		mutationFn: (choices: AddSeriesChoices) => addSeries({ tvdbId: series.tvdbId, ...choices }),
		onSuccess: onAdded,
		onError: (error: unknown) => toast.error(getApiErrorMessage(error))
	});
	if (options.isPending) return <LoadingSpinner />;
	if (options.isError) return <ErrorMessage message={getApiErrorMessage(options.error)} />;
	const initial = { ...resolveAddSeriesDefaults(readAddSeriesPrefs(storage), options.data), seriesType: suggestSeriesType(series.genres) };
	const submit = ({ seriesType, ...prefs }: AddSeriesChoices) => {
		writeAddSeriesPrefs(storage, prefs);
		add.mutate({ ...prefs, seriesType });
	};
	return <AddSeriesForm options={options.data} initial={initial} isSubmitting={add.isPending} onSubmit={submit} />;
}

interface AddSeriesDrawerProps {
	/** null keeps the drawer closed. */
	series: SeriesLookupResult | null;
	storage: PrefsStorage | null;
	onClose: () => void;
	onAdded: (series: SeriesLookupResult, seriesId: number) => void;
}

/**
 * The add form for one lookup result; stays open on failure so the admin can fix and retry.
 * @example <AddSeriesDrawer series={selected} storage={storage} onClose={close} onAdded={markAdded} />
 */
export function AddSeriesDrawer({ series, storage, onClose, onAdded }: AddSeriesDrawerProps) {
	const title = series ? `Adicionar — ${series.title} (${series.year})` : '';
	return (
		<Drawer open={series !== null} title={title} onClose={onClose}>
			{series && <AddSeriesPanel key={series.tvdbId} series={series} storage={storage} onAdded={(id) => onAdded(series, id)} />}
		</Drawer>
	);
}
