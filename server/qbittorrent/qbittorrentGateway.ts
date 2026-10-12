import { QBittorrent } from '@ctrl/qbittorrent'
import type { QbittorrentConfig } from '../config.js'
import type { RawTorrent } from './summarizeTorrents.js'

export interface QbittorrentStatusInfo {
  version: string
  apiVersion: string
  /** bytes/s */
  downloadSpeed: number
  /** bytes/s */
  uploadSpeed: number
}

/** What the routes need from qBittorrent; the fake in server/test implements it too. */
export interface QbittorrentGateway {
  listTorrents(): Promise<RawTorrent[]>
  readStatus(): Promise<QbittorrentStatusInfo>
}

/** Any qBittorrent failure, with a message safe to return to the browser. */
export class QbittorrentGatewayError extends Error {}

export const QBITTORRENT_TIMEOUT_MS = 5000

interface TransferInfo {
  dl_info_speed: number
  up_info_speed: number
}

// The lib throws this when /auth/login answers "Fails." without a SID cookie.
const AUTH_FAILED_MESSAGE = 'Auth Failed'

/**
 * Thin wrapper over `@ctrl/qbittorrent`: the lib owns the session (cookie, expiry, one relogin
 * on 401/403); this class narrows the data and turns failures into QbittorrentGatewayError.
 * @example const torrents = await new CtrlQbittorrentGateway(config.qbittorrent).listTorrents()
 */
export class CtrlQbittorrentGateway implements QbittorrentGateway {
  private readonly client: QBittorrent

  constructor(private readonly config: QbittorrentConfig, readonly timeoutMs = QBITTORRENT_TIMEOUT_MS) {
    this.client = new QBittorrent({
      baseUrl: config.url,
      username: config.username,
      password: config.password,
      timeout: timeoutMs,
    })
  }

  listTorrents(): Promise<RawTorrent[]> {
    return this.guard(async () => (await this.client.listTorrents()).map(toRawTorrent))
  }

  readStatus(): Promise<QbittorrentStatusInfo> {
    return this.guard(async () => {
      const version = await this.client.getAppVersion()
      const apiVersion = await this.client.getApiVersion()
      const transfer = await this.client.request<TransferInfo>('/transfer/info', 'GET')
      return { version, apiVersion, downloadSpeed: transfer.dl_info_speed, uploadSpeed: transfer.up_info_speed }
    })
  }

  private async guard<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call()
    } catch (error: unknown) {
      throw this.describe(error)
    }
  }

  private describe(error: unknown): QbittorrentGatewayError {
    const reason = error instanceof Error ? error.message : String(error)
    if (reason.includes(AUTH_FAILED_MESSAGE)) {
      return new QbittorrentGatewayError(`qBittorrent recusou as credenciais do usuário ${this.config.username}`)
    }
    return new QbittorrentGatewayError(`qBittorrent indisponível em ${this.config.url}: ${reason}`)
  }
}

function toRawTorrent(torrent: RawTorrent): RawTorrent {
  const { hash, name, state, progress, dlspeed, eta, category } = torrent
  return { hash, name, state, progress, dlspeed, eta, category }
}
