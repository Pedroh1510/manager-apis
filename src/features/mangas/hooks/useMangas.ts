import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	fetchMangaList,
	deleteManga as deleteMangaApi,
	addManga as addMangaApi,
	linkConnector as linkConnectorApi
} from '../services/api';
import type { CreateMangaWithConnectorPayload } from '../services/types';

export function useMangas() {
	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ['mangas', 'list'] });

	const mangas = useQuery({
		queryKey: ['mangas', 'list'],
		queryFn: fetchMangaList
	});

	const deleteManga = useMutation({
		mutationFn: (idManga: number) => deleteMangaApi(idManga),
		onSuccess: invalidate
	});

	const addManga = useMutation({
		mutationFn: async (payload: CreateMangaWithConnectorPayload) => {
			const { idManga } = await addMangaApi({ title: payload.title });
			await linkConnectorApi(idManga, {
				idPlugin: payload.idPlugin,
				idMangaPlugin: payload.idMangaPlugin,
				titlePlugin: payload.titlePlugin
			});
			return idManga;
		},
		onSuccess: invalidate
	});

	return { mangas, deleteManga, addManga };
}
