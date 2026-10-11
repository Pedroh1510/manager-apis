/** Mirrors the server (door 5 of PR 4b), so a bad file is refused before any byte goes up. */
export const UPLOAD_EXTENSIONS = ['.mkv', '.mp4', '.avi', '.srt', '.ass'];

export const MAX_UPLOAD_BYTES = 20 * 1024 ** 3;

const extensionOf = (name: string) => {
	const dot = name.lastIndexOf('.');
	return dot === -1 ? '' : name.slice(dot).toLowerCase();
};

/**
 * Why the server would refuse this file, or null when it can go.
 * @example validateUploadFile({ name: 'a.txt', size: 1 }) // 'extensão não aceita: .txt'
 */
export function validateUploadFile(file: { name: string; size: number }): string | null {
	const extension = extensionOf(file.name);
	if (!UPLOAD_EXTENSIONS.includes(extension)) return `extensão não aceita: ${extension || '(nenhuma)'}`;
	if (file.size > MAX_UPLOAD_BYTES) return 'maior que 20 GB';
	return null;
}
