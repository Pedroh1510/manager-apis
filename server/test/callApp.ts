import type { TestApp } from './startTestApp.js'

export interface AppAnswer {
  status: number
  body: string
}

/**
 * One request to the in-process app; a string body goes out raw (for malformed JSON).
 * @example const res = await callApp(app, 'PUT', '/api/sonarr/episodes/monitor', { episodeIds: [1], monitored: true })
 */
export async function callApp(app: TestApp, method: string, path: string, body?: unknown): Promise<AppAnswer> {
  const res = await fetch(`${app.url}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  return { status: res.status, body: await res.text() }
}
