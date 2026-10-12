// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { CtrlQbittorrentGateway, QbittorrentGatewayError } from './qbittorrentGateway.js'
import { FakeQbittorrentWebUi, type FakeWebUiOptions } from '../test/FakeQbittorrentWebUi.js'
import type { RawTorrent } from './summarizeTorrents.js'

const credentials = { username: 'bob-user', password: 's3cr3t-pass' }
let webUi: FakeQbittorrentWebUi | undefined

afterEach(async () => {
  await webUi?.close()
  webUi = undefined
})

async function gatewayFor(options: FakeWebUiOptions, timeoutMs?: number) {
  webUi = await FakeQbittorrentWebUi.start(options)
  return new CtrlQbittorrentGateway({ url: webUi.url, ...credentials }, timeoutMs)
}

const row: RawTorrent = { hash: 'a', name: 'Show', state: 'downloading', progress: 0.5, dlspeed: 10, eta: 60, category: 'anime' }

describe('CtrlQbittorrentGateway', () => {
  it('status reads version, api version and transfer info', async () => {
    const gateway = await gatewayFor({ transfer: { dl_info_speed: 2621440, up_info_speed: 51200 } })

    expect(await gateway.readStatus()).toEqual({
      version: 'v4.6.7',
      apiVersion: '2.9.3',
      downloadSpeed: 2621440,
      uploadSpeed: 51200,
    })
  })

  it('lists torrents with the fields the summary reads', async () => {
    const gateway = await gatewayFor({ torrents: [row] })
    expect(await gateway.listTorrents()).toEqual([row])
  })

  it('default timeout is 5000ms', () => {
    const gateway = new CtrlQbittorrentGateway({ url: 'http://127.0.0.1:1', ...credentials })
    expect(gateway.timeoutMs).toBe(5000)
  })

  it('timeout and refused connection become unavailable errors', async () => {
    const slow = await gatewayFor({ delayMs: 200 }, 50)
    const slowUrl = webUi!.url
    await expect(slow.listTorrents()).rejects.toThrow(`qBittorrent indisponível em ${slowUrl}:`)
    await webUi!.close()
    webUi = undefined

    const refused = new CtrlQbittorrentGateway({ url: slowUrl, ...credentials }, 50)
    await expect(refused.listTorrents()).rejects.toThrow(`qBittorrent indisponível em ${slowUrl}:`)
    await expect(refused.listTorrents()).rejects.toBeInstanceOf(QbittorrentGatewayError)
  })

  it('rejected credentials become a 502 naming the user', async () => {
    const gateway = await gatewayFor({ rejectLogin: true })
    await expect(gateway.listTorrents()).rejects.toThrow('qBittorrent recusou as credenciais do usuário bob-user')
  })

  it('relogs once on 403 and fails after a second 403', async () => {
    const once = await gatewayFor({ forbiddenTorrentCalls: 1, torrents: [row] })
    expect(await once.listTorrents()).toEqual([row])
    expect(webUi!.loginCount).toBe(2)
    await webUi!.close()

    const always = await gatewayFor({ forbiddenTorrentCalls: 99 })
    await expect(always.listTorrents()).rejects.toThrow('qBittorrent indisponível em')
  })
})
