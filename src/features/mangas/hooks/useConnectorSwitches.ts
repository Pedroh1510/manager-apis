import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { fetchConnectorSwitches, setConnectorSwitch } from '../services/api';

export const CONNECTOR_SWITCHES_KEY = ['mangas', 'connector-switches'] as const;

export interface SetSwitchVariables {
	idPlugin: string;
	enabled: boolean;
	reason?: string;
}

/**
 * Global on/off list of connectors for the admin page. A change invalidates
 * every `['mangas', …]` query: plugins, manga list and detail all show it.
 * @example const { switches, setSwitch } = useConnectorSwitches(); setSwitch.mutate({ idPlugin: 'wicomix', enabled: true })
 */
export function useConnectorSwitches() {
	const queryClient = useQueryClient();
	const toast = useToast();
	const switches = useQuery({ queryKey: CONNECTOR_SWITCHES_KEY, queryFn: fetchConnectorSwitches });
	const setSwitch = useMutation({
		mutationFn: ({ idPlugin, enabled, reason }: SetSwitchVariables) =>
			setConnectorSwitch(idPlugin, enabled ? { enabled } : { enabled, reason }),
		onSuccess: (_data, { idPlugin, enabled }) => {
			toast.success(`Conector ${idPlugin} ${enabled ? 'ligado' : 'desligado'}`);
			return queryClient.invalidateQueries({ queryKey: ['mangas'] });
		},
		onError: (error: unknown) => toast.error(getApiErrorMessage(error))
	});
	return { switches, setSwitch };
}
