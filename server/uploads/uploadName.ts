/** Video and subtitle files only (decision Q6). */
export const UPLOAD_EXTENSIONS = ['.mkv', '.mp4', '.avi', '.srt', '.ass'] as const

const MAX_NAME_BYTES = 255

/** A name that is not a plain video or subtitle file name (400). */
export class InvalidUploadNameError extends Error {
  constructor(name: string) {
    super(`nome de arquivo inválido: "${name}", esperado nome simples com extensão ${UPLOAD_EXTENSIONS.join(', ').replace(/, (?=[^,]*$)/, ' ou ')}`)
  }
}

const hasAllowedExtension = (name: string) => UPLOAD_EXTENSIONS.some((extension) => name.toLowerCase().endsWith(extension))

/**
 * A bare file name that stays inside the upload folder (door 5): no separators, no `..`, no dot files.
 * @example parseUploadName('Ep 07.mkv') // 'Ep 07.mkv'
 */
export function parseUploadName(raw: string): string {
  const isPlain = raw !== '' && !/[/\\]/.test(raw) && !raw.includes('..') && !raw.startsWith('.')
  if (isPlain && hasAllowedExtension(raw) && Buffer.byteLength(raw) <= MAX_NAME_BYTES) return raw
  throw new InvalidUploadNameError(raw)
}
