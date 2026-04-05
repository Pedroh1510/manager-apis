import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	fetchMangaList,
	deleteManga as deleteMangaApi,
	addManga as addMangaApi
} from '../services/api';
import type { AddMangaPayload } from '../services/types';

export function useMangas() {
	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ['mangas', 'list'] });

	const mangas = useQuery({
		queryKey: ['mangas', 'list'],
		queryFn: fetchMangaList
	});

	const deleteManga = useMutation({
		mutationFn: deleteMangaApi,
		onSuccess: invalidate
	});

	const addManga = useMutation({
		mutationFn: (payload: AddMangaPayload) => addMangaApi(payload),
		onSuccess: invalidate
	});

	return { mangas, deleteManga, addManga };
}
