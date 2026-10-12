import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { fetchCommandState, startManualImport } from '../services/api';
import type { CommandStatus, ImportChoice, ImportFileSource } from '../services/types';

/** Sonarr finishes a ManualImport in seconds, so the screen follows it (decision Q8). */
export const COMMAND_POLL_MS = 2000;

/**
 * Sends a ManualImport and polls its command until it ends; `onCompleted` runs only on success.
 * @example const { start, isImporting } = useManualImport(closeAndRefresh)
 */
export function useManualImport(onCompleted: () => void) {
	const toast = useToast();
	const [isImporting, setIsImporting] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	useEffect(() => () => clearTimeout(timer.current), []);

	const stopWithError = (text: string) => {
		setIsImporting(false);
		toast.error(text);
	};
	const finish = (status: CommandStatus) => {
		if (status.state === 'failed') return stopWithError(status.message ?? 'Importação falhou no Sonarr');
		setIsImporting(false);
		toast.success(status.message ?? 'Importação concluída');
		onCompleted();
	};
	const scheduleCheck = (commandId: number) => {
		timer.current = setTimeout(() => {
			fetchCommandState(commandId)
				.then((status) => (status.state === 'pending' ? scheduleCheck(commandId) : finish(status)))
				.catch((error: unknown) => stopWithError(getApiErrorMessage(error)));
		}, COMMAND_POLL_MS);
	};
	const start = (source: ImportFileSource, files: ImportChoice[]) => {
		setIsImporting(true);
		startManualImport(source, files)
			.then(scheduleCheck)
			.catch((error: unknown) => stopWithError(getApiErrorMessage(error)));
	};
	return { start, isImporting };
}
