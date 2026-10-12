export interface QbittorrentConfig {
  url: string
  username: string
  password: string
}

export interface SonarrConfig {
  url: string
  apiKey: string
}

export interface ServerConfig {
  port: number
  /** null when QBITTORRENT_URL is absent: the integration is disabled, not broken. */
  qbittorrent: QbittorrentConfig | null
  /** null when SONARR_URL is absent. */
  sonarr: SonarrConfig | null
}

export type ServerEnv = Record<string, string | undefined>

const DEFAULT_PORT = 3002
const MAX_PORT = 65535

/**
 * Reads the server env. Absent integration env disables it; malformed env throws, so the
 * container fails at boot instead of on the first request.
 * @example const config = parseServerConfig(process.env)
 */
export function parseServerConfig(env: ServerEnv): ServerConfig {
  return { port: parsePort(env.PORT), qbittorrent: parseQbittorrent(env), sonarr: parseSonarr(env) }
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_PORT
  const port = Number(raw)
  if (Number.isInteger(port) && port >= 1 && port <= MAX_PORT) return port
  throw new Error(`PORT inválido: "${raw}", esperado inteiro 1-${MAX_PORT}`)
}

function parseQbittorrent(env: ServerEnv): QbittorrentConfig | null {
  const url = env.QBITTORRENT_URL
  if (!url) return null
  assertHttpUrl('QBITTORRENT_URL', url)
  const requireQbittorrentVar = (name: string) => requireVar(env, name, 'QBITTORRENT_URL')
  return { url, username: requireQbittorrentVar('QBITTORRENT_USER'), password: requireQbittorrentVar('QBITTORRENT_PASS') }
}

function parseSonarr(env: ServerEnv): SonarrConfig | null {
  const url = env.SONARR_URL
  if (!url) return null
  assertHttpUrl('SONARR_URL', url)
  return { url, apiKey: requireVar(env, 'SONARR_API_KEY', 'SONARR_URL') }
}

function assertHttpUrl(name: string, raw: string): void {
  const isHttp = URL.canParse(raw) && ['http:', 'https:'].includes(new URL(raw).protocol)
  if (!isHttp) throw new Error(`${name} inválida: "${raw}", esperado http(s)://host:porta`)
}

function requireVar(env: ServerEnv, name: string, enabledBy: string): string {
  const value = env[name]
  if (value) return value
  throw new Error(`${name} ausente: obrigatória quando ${enabledBy} está definida`)
}
