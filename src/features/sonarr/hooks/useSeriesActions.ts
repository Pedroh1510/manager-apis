import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { searchEpisode, searchSeason, setEpisodesMonitored, setSeasonMonitored } from '../services/api';

/** What the screen is acting on, so only that control shows as busy. */
export type ActionTarget = { kind: 'episode'; episodeId: number } | { kind: 'season'; seasonNumber: number };

export const targetKey = (target: ActionTarget) =>
	target.kind === 'episode' ? `episode:${target.episodeId}` : `season:${target.seasonNumber}`;

/**
 * Monitor toggles refresh the detail (Sonarr's saved state); searches only confirm the send,
 * because their result arrives minutes later.
 * @example const { toggleMonitored, search, busyMonitorKey } = useSeriesActions(seriesId)
 */
export function useSeriesActions(seriesId: number) {
	const queryClient = useQueryClient();
	const toast = useToast();
	const onError = (error: unknown) => toast.error(getApiErrorMessage(error));

	const monitor = useMutation({
		mutationFn: ({ target, monitored }: { target: ActionTarget; monitored: boolean }) =>
			target.kind === 'episode'
				? setEpisodesMonitored([target.episodeId], monitored)
				: setSeasonMonitored(seriesId, target.seasonNumber, monitored),
		onSuccess: (_data, { monitored }) => {
			toast.success(monitored ? 'Monitoramento ativado' : 'Monitoramento desativado');
			return queryClient.invalidateQueries({ queryKey: ['sonarr', 'series', seriesId] });
		},
		onError
	});

	const searchMutation = useMutation({
		mutationFn: (target: ActionTarget) =>
			target.kind === 'episode' ? searchEpisode(target.episodeId) : searchSeason(seriesId, target.seasonNumber),
		onSuccess: () => toast.success('Busca enviada'),
		onError
	});

	return {
		toggleMonitored: (target: ActionTarget, monitored: boolean) => monitor.mutate({ target, monitored }),
		search: (target: ActionTarget) => searchMutation.mutate(target),
		busyMonitorKey: monitor.isPending && monitor.variables ? targetKey(monitor.variables.target) : null,
		busySearchKey: searchMutation.isPending && searchMutation.variables ? targetKey(searchMutation.variables) : null
	};
}
