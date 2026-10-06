import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
	updateCookie as updateCookieApi,
	updateCredentials as updateCredentialsApi,
	updateMangasByPlugin as updateMangasByPluginApi
} from '../services/api';
import type {
	UpdateCookiePayload,
	UpdateCredentialsPayload
} from '../services/types';

export function useAdminActions() {
	const toast = useToast();
	const notify = (successText: string) => ({
		onSuccess: () => toast.success(successText),
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

	const updateMangasByPlugin = useMutation({
		mutationFn: (idPlugin: string) => updateMangasByPluginApi(idPlugin),
		...notify('Atualização dos mangás enfileirada')
	});

	return { updateCookie, updateCredentials, updateMangasByPlugin };
}
