import { useMutation } from '@tanstack/react-query';
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
	const updateCookie = useMutation({
		mutationFn: (payload: UpdateCookiePayload) => updateCookieApi(payload)
	});

	const updateCredentials = useMutation({
		mutationFn: (payload: UpdateCredentialsPayload) =>
			updateCredentialsApi(payload)
	});

	const updateMangasByPlugin = useMutation({
		mutationFn: (idPlugin: string) => updateMangasByPluginApi(idPlugin)
	});

	return { updateCookie, updateCredentials, updateMangasByPlugin };
}
