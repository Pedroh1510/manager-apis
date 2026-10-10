import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Drawer } from '../../../components/ui/Drawer';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { formatAge, formatBytes } from '../lib/formatSeries';
import { fetchReleases, grabRelease } from '../services/api';
import type { ReleaseQuery, ReleaseSummary } from '../services/types';

interface ReleaseRowProps {
	release: ReleaseSummary;
	isSent: boolean;
	isSending: boolean;
	onGrab: () => void;
}

function ReleaseRow({ release, isSent, isSending, onGrab }: ReleaseRowProps) {
	const peers = release.seeders === null ? '—' : `${release.seeders}/${release.leechers ?? '—'}`;
	return (
		<li data-testid={`release-${release.guid}`} className={`space-y-1.5 border-b border-border py-3 last:border-b-0 ${release.approved ? '' : 'opacity-60'}`}>
			<p className='break-all text-sm font-medium text-text'>{release.title}</p>
			{release.rejections.length > 0 && (
				<ul className='space-y-0.5 text-xs text-danger'>
					{release.rejections.map((reason) => (
						<li key={reason}>{reason}</li>
					))}
				</ul>
			)}
			<div className='flex items-center justify-between gap-2'>
				<p className='flex flex-wrap gap-x-3 font-mono text-xs text-text-muted'>
					<span>{release.indexer}</span>
					<span>{release.quality}</span>
					<span>{formatBytes(release.size)}</span>
					<span>{peers}</span>
					<span>{formatAge(release.ageHours)}</span>
				</p>
				<Button size='sm' variant={release.approved ? 'primary' : 'secondary'} disabled={isSent || isSending} onClick={onGrab}>
					{isSent ? 'Enviado' : 'Baixar'}
				</Button>
			</div>
		</li>
	);
}

function useGrab() {
	const toast = useToast();
	const [sentGuids, setSentGuids] = useState<ReadonlySet<string>>(new Set());
	const grab = useMutation({
		mutationFn: (release: ReleaseSummary) => grabRelease({ guid: release.guid, indexerId: release.indexerId }),
		onSuccess: (_data, release) => {
			setSentGuids((current) => new Set(current).add(release.guid));
			toast.success('Enviado para download');
		},
		onError: (error: unknown) => toast.error(getApiErrorMessage(error))
	});
	const sendingGuid = grab.isPending ? grab.variables?.guid : undefined;
	return { send: (release: ReleaseSummary) => grab.mutate(release), sentGuids, sendingGuid };
}

function ReleaseList({ query }: { query: ReleaseQuery }) {
	// Each search hits every indexer live, so it is never retried or reused from cache.
	const releases = useQuery({ queryKey: ['sonarr', 'releases', query], queryFn: () => fetchReleases(query), retry: false, gcTime: 0 });
	const { send, sentGuids, sendingGuid } = useGrab();
	const [pendingRejected, setPendingRejected] = useState<ReleaseSummary | null>(null);

	if (releases.isPending) {
		return (
			<div className='text-center'>
				<LoadingSpinner />
				<p className='text-sm text-text-muted'>Consultando indexers…</p>
			</div>
		);
	}
	if (releases.isError) return <ErrorMessage message={getApiErrorMessage(releases.error)} />;
	if (releases.data.length === 0) return <p className='py-8 text-center text-sm text-text-muted'>Nenhum release encontrado</p>;
	return (
		<>
			<ul>
				{releases.data.map((release) => (
					<ReleaseRow
						key={release.guid}
						release={release}
						isSent={sentGuids.has(release.guid)}
						isSending={sendingGuid === release.guid}
						onGrab={() => (release.approved ? send(release) : setPendingRejected(release))}
					/>
				))}
			</ul>
			<ConfirmDialog
				open={pendingRejected !== null}
				title='Baixar mesmo assim?'
				message={`O Sonarr recusaria ${pendingRejected?.title ?? ''} por:`}
				onCancel={() => setPendingRejected(null)}
				onConfirm={() => {
					if (pendingRejected) send(pendingRejected);
					setPendingRejected(null);
				}}
			>
				<ul className='list-disc space-y-0.5 pl-5 text-sm text-text'>
					{pendingRejected?.rejections.map((reason) => <li key={reason}>{reason}</li>)}
				</ul>
			</ConfirmDialog>
		</>
	);
}

interface ReleasesDrawerProps {
	/** null keeps the drawer closed. */
	search: { query: ReleaseQuery; subject: string } | null;
	onClose: () => void;
}

/**
 * Interactive search: every indexer's releases, approved first, each one grabbable.
 * @example <ReleasesDrawer search={{ query: { episodeId: 11 }, subject: 'S01E03' }} onClose={close} />
 */
export function ReleasesDrawer({ search, onClose }: ReleasesDrawerProps) {
	return (
		<Drawer open={search !== null} title={`Releases — ${search?.subject ?? ''}`} onClose={onClose}>
			{search && <ReleaseList query={search.query} />}
		</Drawer>
	);
}
