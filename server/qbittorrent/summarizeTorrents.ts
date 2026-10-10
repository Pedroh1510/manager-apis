/** The fields of a qBittorrent `/torrents/info` row this server reads. */
export interface RawTorrent {
  hash: string
  name: string
  state: string
  /** 0..1 */
  progress: number
  /** bytes/s */
  dlspeed: number
  /** seconds; INFINITE_ETA when qBittorrent has no estimate */
  eta: number
  category: string
}

export type TorrentGroup = 'downloading' | 'completed' | 'queued' | 'stopped'

export type TorrentCounts = Record<TorrentGroup, number>

export interface ActiveTorrent {
  hash: string
  name: string
  progress: number
  downloadSpeed: number
  etaSeconds: number | null
  category: string
}

export interface TorrentsSummary {
  counts: TorrentCounts
  overallEtaSeconds: number | null
  etaUnknownCount: number
  active: ActiveTorrent[]
}

/** qBittorrent's sentinel for "no estimate" (100 days). */
const INFINITE_ETA = 8640000

// Checked before progress: an errored torrent at 100% still needs attention.
const STOPPED_STATES = new Set(['error', 'missingFiles', 'pausedDL', 'stoppedDL', 'unknown'])

/**
 * Groups a torrent by the first matching rule: stopped state, then complete, then queued.
 * @example classifyTorrent({ ...row, state: 'queuedDL' }) // 'queued'
 */
export function classifyTorrent(torrent: RawTorrent): TorrentGroup {
  if (STOPPED_STATES.has(torrent.state)) return 'stopped'
  if (torrent.progress >= 1) return 'completed'
  if (torrent.state === 'queuedDL') return 'queued'
  return 'downloading'
}

/**
 * Counts per group plus the downloading list the Torrents screen shows.
 * @example const { counts, active } = summarizeTorrents(await gateway.listTorrents())
 */
export function summarizeTorrents(torrents: RawTorrent[]): TorrentsSummary {
  const active = torrents.filter((t) => classifyTorrent(t) === 'downloading').map(toActiveTorrent)
  const finiteEtas = active.flatMap((t) => (t.etaSeconds === null ? [] : [t.etaSeconds]))
  return {
    counts: countTorrentGroups(torrents),
    overallEtaSeconds: finiteEtas.length ? Math.max(...finiteEtas) : null,
    etaUnknownCount: active.length - finiteEtas.length,
    active: [...active].sort(compareEta),
  }
}

/**
 * @example countTorrentGroups(rows).downloading
 */
export function countTorrentGroups(torrents: RawTorrent[]): TorrentCounts {
  const counts: TorrentCounts = { downloading: 0, completed: 0, queued: 0, stopped: 0 }
  for (const torrent of torrents) counts[classifyTorrent(torrent)] += 1
  return counts
}

function toActiveTorrent(torrent: RawTorrent): ActiveTorrent {
  return {
    hash: torrent.hash,
    name: torrent.name,
    progress: torrent.progress,
    downloadSpeed: torrent.dlspeed,
    etaSeconds: torrent.eta >= INFINITE_ETA ? null : torrent.eta,
    category: torrent.category,
  }
}

function compareEta(a: ActiveTorrent, b: ActiveTorrent): number {
  return (a.etaSeconds ?? Number.POSITIVE_INFINITY) - (b.etaSeconds ?? Number.POSITIVE_INFINITY)
}
