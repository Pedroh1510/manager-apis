import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { getApiErrorMessage, getApiErrorStatus } from '../../../lib/apiError';
import { ActiveTorrentsTable } from '../components/ActiveTorrentsTable';
import { TorrentSummaryCards } from '../components/TorrentSummaryCards';
import { useTorrents } from '../hooks/useTorrents';

const HTTP_SERVICE_UNAVAILABLE = 503;

function TorrentsError({ error }: { error: unknown }) {
	if (getApiErrorStatus(error) === HTTP_SERVICE_UNAVAILABLE) {
		return <p className='text-sm text-text-muted'>qBittorrent não configurado</p>;
	}
	return <ErrorMessage message={getApiErrorMessage(error)} />;
}

/**
 * qBittorrent at a glance, refreshed every 5s: counts, overall ETA and what is downloading.
 * @example <Route path='torrents' element={<TorrentsPage />} />
 */
export function TorrentsPage() {
	const { data, error, isPending } = useTorrents();
	return (
		<div className='mx-auto max-w-6xl space-y-4'>
			<PageHeader title='Torrents' subtitle='qBittorrent, atualizado a cada 5 s' />
			{isPending && !error && <LoadingSpinner />}
			{error && !data && <TorrentsError error={error} />}
			{data && (
				<>
					<TorrentSummaryCards summary={data} />
					<ActiveTorrentsTable torrents={data.active} />
				</>
			)}
		</div>
	);
}
