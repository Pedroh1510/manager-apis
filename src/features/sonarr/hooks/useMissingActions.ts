import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { searchAllMissing, searchEpisode, searchEpisodes } from '../services/api';

/**
 * The three searches of the missing screen; each only confirms the send, like the detail (decision P3).
 * @example const { searchOne, searchSelected, searchAll } = useMissingActions()
 */
export function useMissingActions() {
	const toast = useToast();
	const handlers = { onSuccess: () => toast.success('Busca enviada'), onError: (error: unknown) => toast.error(getApiErrorMessage(error)) };
	const one = useMutation({ mutationFn: (episodeId: number) => searchEpisode(episodeId), ...handlers });
	const selected = useMutation({ mutationFn: (episodeIds: number[]) => searchEpisodes(episodeIds), ...handlers });
	const all = useMutation({ mutationFn: () => searchAllMissing(), ...handlers });
	return {
		searchOne: (episodeId: number) => one.mutate(episodeId),
		/** `onSent` runs only when Sonarr accepted, so a failure keeps the selection for a retry. */
		searchSelected: (episodeIds: number[], onSent: () => void) => selected.mutate(episodeIds, { onSuccess: onSent }),
		searchAll: () => all.mutate(),
		busyEpisodeId: one.isPending ? one.variables : undefined,
		isSearchingSelected: selected.isPending
	};
}
