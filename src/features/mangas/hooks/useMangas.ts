import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
	fetchMangaList,
	deleteManga as deleteMangaApi,
	addManga as addMangaApi,
	linkConnector as linkConnectorApi,
	setAllConnectorsActive as setAllConnectorsActiveApi,
	setConnectorActive as setConnectorActiveApi
} from '../services/api';
import type { CreateMangaWithConnectorPayload } from '../services/types';

export const MANGA_LIST_KEY = ['mangas', 'list'] as const;

export function useMangas() {
	const queryClient = useQueryClient();
	const toast = useToast();
	const invalidate = () => queryClient.invalidateQueries({ queryKey: MANGA_LIST_KEY });
	const notify = (successText: string) => ({
		onSuccess: () => {
			toast.success(successText);
			return invalidate();
		},
		onError: (error: unknown) => toast.error(getApiErrorMessage(error))
	});

	const mangas = useQuery({ queryKey: MANGA_LIST_KEY, queryFn: fetchMangaList });

	const deleteManga = useMutation({
		mutationFn: (idManga: number) => deleteMangaApi(idManga),
		...notify('Mangá removido')
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
		...notify('Mangá adicionado')
	});

	const setAllConnectorsActive = useMutation({
		mutationFn: ({ idManga, isActive }: { idManga: number; isActive: boolean }) =>
			setAllConnectorsActiveApi(idManga, isActive),
		...notify('Conectores atualizados')
	});

	const setConnectorActive = useMutation({
		mutationFn: ({ idManga, idPlugin, isActive }: { idManga: number; idPlugin: string; isActive: boolean }) =>
			setConnectorActiveApi(idManga, idPlugin, isActive),
		...notify('Conector atualizado')
	});

	return { mangas, deleteManga, addManga, setAllConnectorsActive, setConnectorActive };
}
