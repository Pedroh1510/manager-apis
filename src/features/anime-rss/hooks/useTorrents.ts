import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
	fetchTorrents,
	fetchConcludedTorrents,
	stopTorrent as stopTorrentApi,
	deleteTorrent as deleteTorrentApi,
	deleteAllTorrents as deleteAllTorrentsApi
} from '../services/api';

export function useTorrents() {
	const queryClient = useQueryClient();
	const toast = useToast();

	const torrents = useQuery({
		queryKey: ['anime-rss', 'torrents'],
		queryFn: fetchTorrents,
		refetchInterval: 5_000
	});

	const concludedTorrents = useQuery({
		queryKey: ['anime-rss', 'torrents-concluded'],
		queryFn: fetchConcludedTorrents
	});

	const notify = (successText: string) => ({
		onSuccess: () => {
			toast.success(successText);
			return queryClient.invalidateQueries({ queryKey: ['anime-rss', 'torrents'] });
		},
		onError: (error: unknown) => toast.error(getApiErrorMessage(error))
	});

	const stopTorrent = useMutation({
		mutationFn: (hash: string) => stopTorrentApi(hash),
		...notify('Torrent pausado')
	});

	const deleteTorrent = useMutation({
		mutationFn: (hash: string) => deleteTorrentApi(hash),
		...notify('Torrent removido')
	});

	const deleteAll = useMutation({
		mutationFn: () => deleteAllTorrentsApi(),
		...notify('Todos os torrents removidos')
	});

	return { torrents, concludedTorrents, stopTorrent, deleteTorrent, deleteAll };
}
