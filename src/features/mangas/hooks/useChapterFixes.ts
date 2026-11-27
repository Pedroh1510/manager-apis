import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
	blockChapter,
	fetchBlockedChapters,
	fetchChapterSources,
	replaceChapterSource,
	unblockChapter
} from '../services/api';

interface ReplaceVariables {
	idChapter: number;
	idMangaConnector: number;
	idChapterPlugin: string;
}

interface BlockVariables {
	idChapter: number;
	reason: string;
}

/**
 * Fixes for a suspicious chapter: list candidate sources, replace the source,
 * block (delete + block) and manage the blocked list. Each change refreshes
 * the chapters and the blocked list and reports through a toast.
 * @example const { blocked, sources, replace, block, unblock } = useChapterFixes(1)
 */
export function useChapterFixes(idManga: number) {
	const queryClient = useQueryClient();
	const toast = useToast();
	const onError = (error: unknown) => toast.error(getApiErrorMessage(error));
	const blockedKey = ['mangas', idManga, 'blocked-chapters'] as const;

	const refresh = () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: ['mangas', idManga, 'chapters'] }),
			queryClient.invalidateQueries({ queryKey: blockedKey })
		]);

	const mutationOptions = (message: string) => ({
		onSuccess: () => {
			toast.success(message);
			return refresh();
		},
		onError
	});

	const blocked = useQuery({ queryKey: blockedKey, queryFn: () => fetchBlockedChapters(idManga) });

	const sources = useMutation({
		mutationFn: (idChapter: number) => fetchChapterSources(idManga, idChapter),
		onError
	});

	const replace = useMutation({
		mutationFn: ({ idChapter, ...payload }: ReplaceVariables) => replaceChapterSource(idManga, idChapter, payload),
		...mutationOptions('Capítulo trocado')
	});

	const block = useMutation({
		mutationFn: ({ idChapter, reason }: BlockVariables) => blockChapter(idManga, idChapter, reason),
		...mutationOptions('Capítulo apagado e bloqueado')
	});

	const unblock = useMutation({
		mutationFn: (idBlockedChapter: number) => unblockChapter(idManga, idBlockedChapter),
		...mutationOptions('Capítulo desbloqueado')
	});

	return { blocked, sources, replace, block, unblock };
}
