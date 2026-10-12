import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { RawTorrent } from '../qbittorrent/summarizeTorrents.js'

export interface FakeWebUiOptions {
  rejectLogin?: boolean
  /** How many `/torrents/info` calls answer 403 before succeeding. */
  forbiddenTorrentCalls?: number
  delayMs?: number
  torrents?: RawTorrent[]
  transfer?: { dl_info_speed: number; up_info_speed: number }
}

/**
 * Local stand-in for qBittorrent's WebUI API v2, enough for the real `@ctrl/qbittorrent` client.
 * @example const webUi = await FakeQbittorrentWebUi.start({ rejectLogin: true })
 */
export class FakeQbittorrentWebUi {
  loginCount = 0
  private forbiddenLeft: number

  private constructor(private readonly server: Server, private readonly options: FakeWebUiOptions) {
    this.forbiddenLeft = options.forbiddenTorrentCalls ?? 0
  }

  static async start(options: FakeWebUiOptions = {}): Promise<FakeQbittorrentWebUi> {
    // Requests only arrive after listen(), when `fake` is already initialised.
    const server = createServer((req, res) => void fake.handle(req, res))
    const fake = new FakeQbittorrentWebUi(server, options)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    return fake
  }

  get url(): string {
    return `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`
  }

  close(): Promise<void> {
    this.server.closeAllConnections()
    return new Promise((resolve) => this.server.close(() => resolve()))
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (this.options.delayMs) await new Promise((resolve) => setTimeout(resolve, this.options.delayMs))
    const path = (req.url ?? '').split('?')[0]
    if (path === '/api/v2/auth/login') return this.login(res)
    if (path === '/api/v2/torrents/info' && this.forbiddenLeft > 0) {
      this.forbiddenLeft -= 1
      return void res.writeHead(403).end('Forbidden')
    }
    this.answer(path, res)
  }

  private login(res: ServerResponse): void {
    this.loginCount += 1
    if (this.options.rejectLogin) return void res.writeHead(200).end('Fails.')
    res.writeHead(200, { 'Set-Cookie': 'SID=fake-sid; HttpOnly; path=/' }).end('Ok.')
  }

  private answer(path: string, res: ServerResponse): void {
    const text = 'text/plain'
    const json = 'application/json'
    const bodies: Record<string, [string, string]> = {
      '/api/v2/app/version': [text, 'v4.6.7'],
      '/api/v2/app/webapiVersion': [text, '2.9.3'],
      '/api/v2/torrents/info': [json, JSON.stringify(this.options.torrents ?? [])],
      '/api/v2/transfer/info': [json, JSON.stringify(this.options.transfer ?? { dl_info_speed: 0, up_info_speed: 0 })],
    }
    const entry = bodies[path]
    if (!entry) return void res.writeHead(404).end('Not Found')
    res.writeHead(200, { 'Content-Type': entry[0] }).end(entry[1])
  }
}
