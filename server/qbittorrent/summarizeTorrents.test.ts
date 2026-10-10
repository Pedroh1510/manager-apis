// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { classifyTorrent, summarizeTorrents, type RawTorrent } from './summarizeTorrents.js'

const INFINITE = 8640000

function torrent(overrides: Partial<RawTorrent>): RawTorrent {
  return { hash: 'h', name: 'n', state: 'downloading', progress: 0.5, dlspeed: 0, eta: 60, category: '', ...overrides }
}

function downloadingWithEtas(etas: number[]): RawTorrent[] {
  return etas.map((eta, i) => torrent({ hash: `h${i}`, eta }))
}

describe('classifyTorrent', () => {
  it('classifies every state by the first matching rule', () => {
    const table: [Partial<RawTorrent>, string][] = [
      [{ state: 'error', progress: 1 }, 'stopped'],
      [{ state: 'missingFiles', progress: 1 }, 'stopped'],
      [{ state: 'pausedDL', progress: 0.3 }, 'stopped'],
      [{ state: 'stoppedDL', progress: 0.3 }, 'stopped'],
      [{ state: 'unknown', progress: 1 }, 'stopped'],
      [{ state: 'uploading', progress: 1 }, 'completed'],
      [{ state: 'stalledUP', progress: 1 }, 'completed'],
      [{ state: 'pausedUP', progress: 1 }, 'completed'],
      [{ state: 'queuedDL', progress: 0 }, 'queued'],
      [{ state: 'downloading', progress: 0.5 }, 'downloading'],
      [{ state: 'stalledDL', progress: 0.5 }, 'downloading'],
      [{ state: 'metaDL', progress: 0 }, 'downloading'],
      [{ state: 'checkingDL', progress: 0.2 }, 'downloading'],
      [{ state: 'forcedDL', progress: 0.9 }, 'downloading'],
      [{ state: 'allocating', progress: 0 }, 'downloading'],
    ]
    expect(table).toHaveLength(15)
    for (const [input, group] of table) {
      expect(classifyTorrent(torrent(input)), JSON.stringify(input)).toBe(group)
    }
  })
})

describe('summarizeTorrents', () => {
  it('active holds downloading torrents ordered by eta with null last', () => {
    const torrents = [
      torrent({ hash: 'a', eta: 600, name: 'A', progress: 0.4, dlspeed: 1000, category: 'anime' }),
      torrent({ hash: 'b', eta: INFINITE }),
      torrent({ hash: 'c', eta: 60 }),
      torrent({ hash: 'done', state: 'uploading', progress: 1 }),
    ]
    const { active } = summarizeTorrents(torrents)

    expect(active.map((t) => t.etaSeconds)).toEqual([60, 600, null])
    expect(active[1]).toEqual({ hash: 'a', name: 'A', progress: 0.4, downloadSpeed: 1000, etaSeconds: 600, category: 'anime' })
    expect(Object.keys(active[0]).sort()).toEqual(['category', 'downloadSpeed', 'etaSeconds', 'hash', 'name', 'progress'])
  })

  it('maps qbittorrent infinite eta to null', () => {
    const { active } = summarizeTorrents(downloadingWithEtas([INFINITE, INFINITE - 1]))
    expect(active.map((t) => t.etaSeconds)).toEqual([INFINITE - 1, null])
  })

  it('overall eta is the largest finite eta', () => {
    expect(summarizeTorrents(downloadingWithEtas([60, 600, INFINITE])).overallEtaSeconds).toBe(600)
    expect(summarizeTorrents(downloadingWithEtas([INFINITE, INFINITE])).overallEtaSeconds).toBeNull()
    expect(summarizeTorrents([]).overallEtaSeconds).toBeNull()
  })

  it('counts downloading torrents without estimate', () => {
    const stoppedInfinite = torrent({ hash: 's', state: 'pausedDL', eta: INFINITE })
    const summary = summarizeTorrents([...downloadingWithEtas([60, INFINITE, INFINITE]), stoppedInfinite])
    expect(summary.etaUnknownCount).toBe(2)
  })

  it('counts every group', () => {
    const torrents = [
      torrent({ state: 'downloading' }),
      torrent({ state: 'uploading', progress: 1 }),
      torrent({ state: 'queuedDL', progress: 0 }),
      torrent({ state: 'error' }),
    ]
    expect(summarizeTorrents(torrents).counts).toEqual({ downloading: 1, completed: 1, queued: 1, stopped: 1 })
  })
})
