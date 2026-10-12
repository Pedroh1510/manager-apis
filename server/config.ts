export interface QbittorrentConfig {
  url: string
  username: string
  password: string
}

import { accessSync, constants, statSync } from 'node:fs'
import { isAbsolute } from 'node:path'

export interface SonarrConfig {
  url: string
  apiKey: string
}

/** Tdarr's own auth is optional, so the key is too (decision Q8). */
export interface TdarrConfig {
  url: string
  apiKey: string | null
}

export interface ServerConfig {
  port: number
  /** null when QBITTORRENT_URL is absent: the integration is disabled, not broken. */
  qbittorrent: QbittorrentConfig | null
  /** null when SONARR_URL is absent. */
  sonarr: SonarrConfig | null
  /** null when SONARR_UPLOAD_DIR is absent: uploads are off, the queue import still works. */
  sonarrUpload: SonarrUploadConfig | null
  /** null when TDARR_URL is absent. */
  tdarr: TdarrConfig | null
}

/** The folder both this server and Sonarr see at the same path (decision Q3). */
export interface SonarrUploadConfig {
  dir: string
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
  const sonarr = parseSonarr(env)
  return { port: parsePort(env.PORT), qbittorrent: parseQbittorrent(env), sonarr, sonarrUpload: parseSonarrUpload(env, sonarr), tdarr: parseTdarr(env) }
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

function parseTdarr(env: ServerEnv): TdarrConfig | null {
  const url = env.TDARR_URL
  const apiKey = env.TDARR_API_KEY || null
  if (!url) {
    if (apiKey) throw new Error('TDARR_API_KEY definida sem TDARR_URL')
    return null
  }
  assertHttpUrl('TDARR_URL', url)
  return { url, apiKey }
}

function parseSonarrUpload(env: ServerEnv, sonarr: SonarrConfig | null): SonarrUploadConfig | null {
  const dir = env.SONARR_UPLOAD_DIR
  if (!dir) return null
  const invalid = (reason: string) => new Error(`SONARR_UPLOAD_DIR inválida: "${dir}", ${reason}`)
  if (!sonarr) throw invalid('exige SONARR_URL definida')
  if (!isAbsolute(dir)) throw invalid('esperado caminho absoluto')
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) throw invalid('esperado pasta existente')
  if (!isWritable(dir)) throw invalid('pasta sem permissão de escrita')
  return { dir }
}

function isWritable(dir: string): boolean {
  try {
    accessSync(dir, constants.W_OK)
    return true
  } catch {
    return false
  }
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
