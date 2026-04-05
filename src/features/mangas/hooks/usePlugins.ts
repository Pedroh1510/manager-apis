import { useQuery } from '@tanstack/react-query';
import { fetchPlugins } from '../services/api';

export function usePlugins() {
	return useQuery({
		queryKey: ['mangas', 'plugins'],
		queryFn: fetchPlugins
	});
}
