import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { acceptCoverSuggestion, dismissCoverSuggestion, fetchCoverSuggestions } from '../services/api';
import type { CoverSuggestion, CoverSuggestionsResponse } from '../services/types';
import { MANGA_LIST_KEY } from './useMangas';

export const COVER_SUGGESTIONS_KEY = ['mangas', 'cover-suggestions'] as const;

type SuggestionFilter = (suggestion: CoverSuggestion) => boolean;

/**
 * Pending cover suggestions plus accept/dismiss; a decided suggestion leaves
 * the cached list right away instead of waiting for a refetch.
 * @example const { suggestions, accept } = useCoverSuggestions(); accept.mutate(suggestion)
 */
export function useCoverSuggestions() {
	const queryClient = useQueryClient();
	const toast = useToast();
	const drop = (isGone: SuggestionFilter) =>
		queryClient.setQueryData<CoverSuggestionsResponse>(COVER_SUGGESTIONS_KEY, (current) =>
			current && {
				suggestions: current.suggestions.filter((s) => !isGone(s)),
				conflicts: current.conflicts.filter((s) => !isGone(s))
			}
		);
	const onError = (error: unknown) => toast.error(getApiErrorMessage(error));

	const suggestions = useQuery({ queryKey: COVER_SUGGESTIONS_KEY, queryFn: fetchCoverSuggestions });

	// Linking the connector settles every suggestion of that manga x connector.
	const accept = useMutation({
		mutationFn: (suggestion: CoverSuggestion) => acceptCoverSuggestion(suggestion.idSuggestion),
		onSuccess: (_, accepted) => {
			drop((s) => s.idManga === accepted.idManga && s.idPlugin === accepted.idPlugin);
			toast.success('Conector adicionado');
			return queryClient.invalidateQueries({ queryKey: MANGA_LIST_KEY });
		},
		onError
	});

	const dismiss = useMutation({
		mutationFn: (suggestion: CoverSuggestion) => dismissCoverSuggestion(suggestion.idSuggestion),
		onSuccess: (_, dismissed) => {
			drop((s) => s.idSuggestion === dismissed.idSuggestion);
		},
		onError
	});

	return { suggestions, accept, dismiss };
}
