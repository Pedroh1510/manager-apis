/**
 * fetch hides ECONNREFUSED and friends in `cause`; surface it so the admin sees why.
 * @example describeFetchFailure(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } })) // 'fetch failed (ECONNREFUSED)'
 */
export function describeFetchFailure(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const cause = error.cause as { code?: unknown; message?: unknown } | undefined
  const detail = typeof cause?.code === 'string' ? cause.code : cause?.message
  return typeof detail === 'string' ? `${error.message} (${detail})` : error.message
}
