import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { getApiErrorStatus } from '../../../lib/apiError';
import type { SeriesRowActions } from '../components/EpisodesTable';
import { ReleasesDrawer } from '../components/ReleasesDrawer';
import { SeasonSection } from '../components/SeasonSection';
import { SeriesPoster } from '../components/SeriesPoster';
import { SeriesStatusBadge } from '../components/SeriesStatusBadge';
import { SonarrError } from '../components/SonarrError';
import { useSeriesDetail } from '../hooks/useSeries';
import { useSeriesActions, type ActionTarget } from '../hooks/useSeriesActions';
import { formatBytes } from '../lib/formatSeries';
import type { ReleaseQuery, SeriesDetail } from '../services/types';

const HTTP_NOT_FOUND = 404;

function SeriesNotFound() {
	return (
		<div className='space-y-2 py-8 text-center'>
			<p className='text-sm text-text'>Série não encontrada</p>
			<Link to='/sonarr' className={`text-sm text-accent hover:underline ${FOCUS_RING}`}>
				Voltar para Séries
			</Link>
		</div>
	);
}

function SeriesHeader({ series }: { series: SeriesDetail }) {
	return (
		<header className='flex gap-5'>
			<SeriesPoster seriesId={series.id} title={series.title} className='w-32 shrink-0 self-start' />
			<div className='min-w-0 space-y-2'>
				<h1 className='text-xl font-semibold tracking-tight text-text'>{series.title}</h1>
				<p className='flex flex-wrap items-center gap-2 text-sm text-text-muted'>
					<span>{series.year}</span>
					{series.network && <span>{series.network}</span>}
					<SeriesStatusBadge status={series.status} />
				</p>
				{series.overview && <p className='max-w-3xl text-sm text-text'>{series.overview}</p>}
				<p className='flex gap-4 font-mono text-xs text-text-subtle'>
					<span>{formatBytes(series.sizeOnDisk)}</span>
					<span>{`${series.episodeFileCount}/${series.episodeCount} episódios`}</span>
				</p>
			</div>
		</header>
	);
}

/** Only the first (newest) season starts open; each header toggles its own season. */
function SeasonList({ series, actions }: { series: SeriesDetail; actions: SeriesRowActions }) {
	const [openSeasons, setOpenSeasons] = useState(() => new Set(series.seasons.slice(0, 1).map((s) => s.seasonNumber)));
	const toggle = (seasonNumber: number) =>
		setOpenSeasons((current) => {
			const next = new Set(current);
			if (next.has(seasonNumber)) next.delete(seasonNumber);
			else next.add(seasonNumber);
			return next;
		});
	return (
		<div className='space-y-3'>
			{series.seasons.map((season) => (
				<SeasonSection
					key={season.seasonNumber}
					season={season}
					isOpen={openSeasons.has(season.seasonNumber)}
					onToggle={() => toggle(season.seasonNumber)}
					actions={actions}
				/>
			))}
		</div>
	);
}

/**
 * One series: header, then seasons newest first with their episodes and state.
 * @example <Route path='sonarr/:seriesId' element={<SeriesDetailPage />} />
 */
export function SeriesDetailPage() {
	const seriesId = Number(useParams().seriesId);
	const { data, error, isPending } = useSeriesDetail(seriesId);
	if (isPending && !error) return <LoadingSpinner />;
	if (getApiErrorStatus(error) === HTTP_NOT_FOUND) return <SeriesNotFound />;
	if (error && !data) return <SonarrError error={error} />;
	if (!data) return null;
	return <SeriesDetailContent series={data} />;
}

function toReleaseQuery(seriesId: number, target: ActionTarget): ReleaseQuery {
	return target.kind === 'episode' ? { episodeId: target.episodeId } : { seriesId, seasonNumber: target.seasonNumber };
}

function SeriesDetailContent({ series }: { series: SeriesDetail }) {
	const { toggleMonitored, search, busyMonitorKey, busySearchKey } = useSeriesActions(series.id);
	const [releaseSearch, setReleaseSearch] = useState<{ query: ReleaseQuery; subject: string } | null>(null);
	const actions: SeriesRowActions = {
		toggleMonitored,
		search,
		busyMonitorKey,
		busySearchKey,
		openReleases: (target, subject) => setReleaseSearch({ query: toReleaseQuery(series.id, target), subject })
	};
	return (
		<div className='mx-auto max-w-6xl space-y-6'>
			<SeriesHeader series={series} />
			<SeasonList series={series} actions={actions} />
			<ReleasesDrawer search={releaseSearch} onClose={() => setReleaseSearch(null)} />
		</div>
	);
}
