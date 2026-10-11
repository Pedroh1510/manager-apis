import { useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '../../../lib/apiError';
import { validateUploadFile } from '../lib/uploadRules';
import { uploadFile } from '../services/api';

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'failed' | 'refused';

export interface UploadItem {
	id: number;
	name: string;
	size: number;
	status: UploadStatus;
	percent: number;
	/** Server error or local refusal reason. */
	error: string | null;
}

/**
 * Uploads files one at a time in the order added (decision U1); a failure does not stop the rest.
 * `onUploaded` runs after each finished file, e.g. to refresh the upload folder.
 * @example const { items, add } = useUploadQueue(refreshFolder)
 */
export function useUploadQueue(onUploaded: () => void) {
	const [items, setItems] = useState<UploadItem[]>([]);
	const waiting = useRef<{ id: number; file: File }[]>([]);
	const isRunning = useRef(false);
	const nextId = useRef(0);
	const onUploadedRef = useRef(onUploaded);
	useEffect(() => {
		onUploadedRef.current = onUploaded;
	});

	const update = (id: number, patch: Partial<UploadItem>) =>
		setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));

	const sendOne = async ({ id, file }: { id: number; file: File }) => {
		update(id, { status: 'uploading', percent: 0 });
		try {
			await uploadFile(file, (percent) => update(id, { percent }));
			update(id, { status: 'done', percent: 100 });
			onUploadedRef.current();
		} catch (error: unknown) {
			update(id, { status: 'failed', error: getApiErrorMessage(error) });
		}
	};

	const run = async () => {
		if (isRunning.current) return;
		isRunning.current = true;
		while (waiting.current.length > 0) {
			const [next, ...rest] = waiting.current;
			waiting.current = rest;
			await sendOne(next);
		}
		isRunning.current = false;
	};

	const add = (files: File[]) => {
		const added = files.map((file): [UploadItem, File] => {
			nextId.current += 1;
			const refusal = validateUploadFile(file);
			const item: UploadItem = { id: nextId.current, name: file.name, size: file.size, status: refusal ? 'refused' : 'queued', percent: 0, error: refusal };
			return [item, file];
		});
		setItems((current) => [...current, ...added.map(([item]) => item)]);
		const accepted = added.filter(([item]) => item.status === 'queued').map(([item, file]) => ({ id: item.id, file }));
		waiting.current = [...waiting.current, ...accepted];
		void run();
	};

	return { items, add };
}
