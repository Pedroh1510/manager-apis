import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { deleteChapter, fetchChapterPages, fetchChapters, fetchMissingChapters } from '../services/api';

/**
 * Chapters of one manga, plus the on-demand missing-chapters check and the
 * per-chapter actions, each reporting through a toast.
 * @example const { chapters, missing, enqueueChapter, removeChapter } = useMangaChapters(1)
 */
export function useMangaChapters(idManga: number) {
	const queryClient = useQueryClient();
	const toast = useToast();
	const chaptersKey = ['mangas', idManga, 'chapters'] as const;
	const onError = (error: unknown) => toast.error(getApiErrorMessage(error));

	const chapters = useQuery({ queryKey: chaptersKey, queryFn: () => fetchChapters(idManga) });

	// Only on demand: it asks every connector, which is slow.
	const missing = useMutation({ mutationFn: () => fetchMissingChapters(idManga), onError });

	const enqueueChapter = useMutation({
		mutationFn: (idChapter: number) => fetchChapterPages(idManga, idChapter),
		onSuccess: () => toast.success('Capítulo enfileirado'),
		onError
	});

	const removeChapter = useMutation({
		mutationFn: (idChapter: number) => deleteChapter(idManga, idChapter),
		onSuccess: () => {
			toast.success('Capítulo removido');
			return queryClient.invalidateQueries({ queryKey: chaptersKey });
		},
		onError
	});

	return { chapters, missing, enqueueChapter, removeChapter };
}
