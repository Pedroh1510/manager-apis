import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { fetchChapterPages, fetchChapters, fetchMissingChapters } from '../services/api';

/**
 * Chapters of one manga, plus the on-demand missing-chapters check and the
 * per-chapter actions, each reporting through a toast.
 * @example const { chapters, missing, enqueueChapter } = useMangaChapters(1)
 */
export function useMangaChapters(idManga: number) {
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

	return { chapters, missing, enqueueChapter };
}
