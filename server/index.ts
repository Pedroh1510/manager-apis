import type { Server } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createApp } from './app.js'
import { parseServerConfig, type ServerEnv } from './config.js'
import { createJsonLogger, type LineWriter } from './logger.js'
import { CtrlQbittorrentGateway } from './qbittorrent/qbittorrentGateway.js'
import { FetchSonarrGateway } from './sonarr/sonarrGateway.js'

export interface RunningServer {
  close(): Promise<void>
}

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
  const app = createApp({ staticDir: STATIC_DIR, qbittorrent, sonarr, logger })
  const server: Server = await new Promise((resolve) => {
    const listening = app.listen(config.port, () => resolve(listening))
  })
  logger.info('server started', { port: config.port, integrations: { qbittorrent: qbittorrent !== null, sonarr: sonarr !== null } })
  return { close: () => new Promise((resolve) => server.close(() => resolve())) }
}

const isEntryPoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href
if (isEntryPoint) await startServer(process.env)
