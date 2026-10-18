import { existsSync } from 'node:fs'
import type { Server } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createApp } from './app.js'
import { parseServerConfig, type ServerEnv } from './config.js'
import { CachedJikanGateway } from './jikan/cachedJikanGateway.js'
import { FetchJikanGateway } from './jikan/jikanGateway.js'
import { createJsonLogger, type LineWriter } from './logger.js'
import { CtrlQbittorrentGateway } from './qbittorrent/qbittorrentGateway.js'
import { FetchSonarrGateway } from './sonarr/sonarrGateway.js'
import { FetchTdarrGateway } from './tdarr/tdarrGateway.js'
import { FsUploadStore } from './uploads/uploadStore.js'

export interface RunningServer {
  /** The listening HTTP server, exposed for its timeouts. */
  server: Server
  close(): Promise<void>
}

/** Uploads of a few GB over the internet outlast Node's 5 min default (decision U4). */
export const REQUEST_TIMEOUT_MS = 2 * 60 * 60 * 1000

// dist-server/index.js and server/index.ts both sit one level below the Vite output.
const STATIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

/**
 * Validates env (throws on malformed values), wires the gateway and listens.
 * @example await startServer(process.env)
 */
export async function startServer(env: ServerEnv, write?: LineWriter): Promise<RunningServer> {
  const config = parseServerConfig(env)
  const logger = createJsonLogger(write)
  const qbittorrent = config.qbittorrent ? new CtrlQbittorrentGateway(config.qbittorrent) : null
  const sonarr = config.sonarr ? new FetchSonarrGateway(config.sonarr) : null
  const uploads = config.sonarrUpload ? new FsUploadStore(config.sonarrUpload.dir) : null
  const tdarr = config.tdarr ? new FetchTdarrGateway(config.tdarr) : null
  // One gateway, so one rate limiter and one cache for the whole process (doors 2 and 3).
  const jikan = new CachedJikanGateway(new FetchJikanGateway(config.jikan))
  const app = createApp({ staticDir: STATIC_DIR, qbittorrent, sonarr, uploads, tdarr, jikan, logger })
  const server: Server = await new Promise((resolve) => {
    const listening = app.listen(config.port, () => resolve(listening))
  })
  server.requestTimeout = REQUEST_TIMEOUT_MS
  const integrations = { qbittorrent: qbittorrent !== null, sonarr: sonarr !== null, sonarrUpload: uploads !== null, tdarr: tdarr !== null, jikan: true }
  logger.info('server started', { port: config.port, integrations })
  return { server, close: () => new Promise((resolve) => server.close(() => resolve())) }
}

/**
 * Local dev reads manager-apis/.env.local and .env (tsx does not); the container has neither and uses its runtime env.
 * Variables already set in the environment win over the file.
 * @example loadEnvFileIfPresent('.env')
 */
export function loadEnvFileIfPresent(path: string): boolean {
  if (!existsSync(path)) return false
  process.loadEnvFile(path)
  return true
}

const isEntryPoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href
if (isEntryPoint) {
  // .env.local first: loadEnvFile never overrides, so it wins over .env (e.g. a dev Sonarr).
  loadEnvFileIfPresent('.env.local')
  loadEnvFileIfPresent('.env')
  await startServer(process.env)
}
