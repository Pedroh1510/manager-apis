import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
	updateCookie as updateCookieApi,
	updateCredentials as updateCredentialsApi,
	searchAllChapters,
	refreshPluginCatalog
} from '../services/api';
import type {
	UpdateCookiePayload,
	UpdateCredentialsPayload
} from '../services/types';

export function useAdminActions() {
	const toast = useToast();
	const notify = <TVariables,>(successText: string | ((variables: TVariables) => string)) => ({
		onSuccess: (_data: unknown, variables: TVariables) =>
			toast.success(typeof successText === 'string' ? successText : successText(variables)),
		onError: (error: unknown) => toast.error(getApiErrorMessage(error))
	});

	const updateCookie = useMutation({
		mutationFn: (payload: UpdateCookiePayload) => updateCookieApi(payload),
		...notify('Cookie atualizado')
	});

	const updateCredentials = useMutation({
		mutationFn: (payload: UpdateCredentialsPayload) =>
			updateCredentialsApi(payload),
		...notify('Credenciais atualizadas')
	});

	const searchChapters = useMutation({
		mutationFn: () => searchAllChapters(),
		...notify<void>('Busca de capítulos enfileirada')
	});

	const refreshCatalog = useMutation({
		mutationFn: (idPlugin: string) => refreshPluginCatalog(idPlugin),
		...notify<string>((idPlugin) => `Atualização do catálogo de ${idPlugin} enfileirada`)
	});

	return { updateCookie, updateCredentials, searchChapters, refreshCatalog };
}
