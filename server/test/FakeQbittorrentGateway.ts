import { QbittorrentGatewayError, type QbittorrentGateway, type QbittorrentStatusInfo } from '../qbittorrent/qbittorrentGateway.js'
import type { RawTorrent } from '../qbittorrent/summarizeTorrents.js'

/**
 * In-memory gateway for route tests; `failWith` makes every call reject like the real one does.
 * @example new FakeQbittorrentGateway({ torrents: [row] })
 */
export class FakeQbittorrentGateway implements QbittorrentGateway {
  constructor(
    private readonly data: { torrents?: RawTorrent[]; status?: QbittorrentStatusInfo; failWith?: string } = {},
  ) {}

  async listTorrents(): Promise<RawTorrent[]> {
    this.throwIfFailing()
    return this.data.torrents ?? []
  }

  async readStatus(): Promise<QbittorrentStatusInfo> {
    this.throwIfFailing()
    return this.data.status ?? { version: 'v4.6.7', apiVersion: '2.9.3', downloadSpeed: 0, uploadSpeed: 0 }
  }

  private throwIfFailing(): void {
    if (this.data.failWith) throw new QbittorrentGatewayError(this.data.failWith)
  }
}
