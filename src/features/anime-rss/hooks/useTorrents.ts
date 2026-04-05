import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	fetchTorrents,
	fetchConcludedTorrents,
	stopTorrent as stopTorrentApi,
	deleteTorrent as deleteTorrentApi,
	deleteAllTorrents as deleteAllTorrentsApi
} from '../services/api';

export function useTorrents() {
	const queryClient = useQueryClient();

	const torrents = useQuery({
		queryKey: ['anime-rss', 'torrents'],
		queryFn: fetchTorrents,
		refetchInterval: 5_000
	});

	const concludedTorrents = useQuery({
		queryKey: ['anime-rss', 'torrents-concluded'],
		queryFn: fetchConcludedTorrents
	});

	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: ['anime-rss', 'torrents'] });
	};

	const stopTorrent = useMutation({
		mutationFn: stopTorrentApi,
		onSuccess: invalidate
	});

	const deleteTorrent = useMutation({
		mutationFn: deleteTorrentApi,
		onSuccess: invalidate
	});

	const deleteAll = useMutation({
		mutationFn: deleteAllTorrentsApi,
		onSuccess: invalidate
	});

	return { torrents, concludedTorrents, stopTorrent, deleteTorrent, deleteAll };
}
