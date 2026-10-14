/** Worker as `GET /api/v2/get-nodes` sends it (Tdarr 2.94.02, checked 2026-10-12). */
export interface RawTdarrWorker {
  _id: string
  /** `transcodegpu`, `transcodecpu`, `healthcheckgpu` or `healthcheckcpu` */
  workerType: string
  file: string
  percentage: number
  /** `H:MM:SS` */
  ETA: string
  fps: number
  idle?: boolean
  originalfileSizeInGbytes: number
  estSize: number
}

export interface RawTdarrWorkerLimits {
  transcodegpu: number
  transcodecpu: number
  healthcheckgpu: number
  healthcheckcpu: number
}

export interface RawTdarrNode {
  _id: string
  nodeName: string
  nodePaused: boolean
  workerLimits: RawTdarrWorkerLimits
  workers: Record<string, RawTdarrWorker>
}

export type TdarrWorkerKind = 'transcode' | 'healthCheck'
export type TdarrHardware = 'gpu' | 'cpu'

export interface TdarrWorker {
  id: string
  kind: TdarrWorkerKind
  hardware: TdarrHardware
  file: string
  percentage: number
  eta: string
  fps: number
  originalSizeGb: number
  estimatedSizeGb: number
}

export interface TdarrWorkerLimits {
  transcodeGpu: number
  transcodeCpu: number
  healthCheckGpu: number
  healthCheckCpu: number
}

export interface TdarrNode {
  id: string
  name: string
  paused: boolean
  online: boolean
  busyWorkers: number
  workerCapacity: number
  workerLimits: TdarrWorkerLimits
  workers: TdarrWorker[]
}

export interface TdarrOverview {
  version: string
  nodes: TdarrNode[]
}

function workerTypeParts(workerType: string): { kind: TdarrWorkerKind; hardware: TdarrHardware } {
  const kind = workerType.startsWith('healthcheck') ? 'healthCheck' : 'transcode'
  return { kind, hardware: workerType.endsWith('gpu') ? 'gpu' : 'cpu' }
}

function toTdarrWorker(raw: RawTdarrWorker): TdarrWorker {
  return {
    id: raw._id,
    ...workerTypeParts(raw.workerType),
    file: raw.file,
    percentage: raw.percentage,
    eta: raw.ETA,
    fps: raw.fps,
    originalSizeGb: raw.originalfileSizeInGbytes,
    estimatedSizeGb: raw.estSize,
  }
}

function toWorkerLimits(raw: RawTdarrWorkerLimits): TdarrWorkerLimits {
  return { transcodeGpu: raw.transcodegpu, transcodeCpu: raw.transcodecpu, healthCheckGpu: raw.healthcheckgpu, healthCheckCpu: raw.healthcheckcpu }
}

function toTdarrNode(raw: RawTdarrNode): TdarrNode {
  const workers = Object.values(raw.workers ?? {}).filter((worker) => worker.idle !== true).map(toTdarrWorker)
  const workerLimits = toWorkerLimits(raw.workerLimits)
  return {
    id: raw._id,
    name: raw.nodeName,
    paused: raw.nodePaused,
    // get-nodes only lists nodes with a live socket and sends no heartbeat field, so listed means online.
    online: true,
    busyWorkers: workers.length,
    workerCapacity: Object.values(workerLimits).reduce((sum, limit) => sum + limit, 0),
    workerLimits,
    workers,
  }
}

/**
 * Tdarr's node map as the app's list: idle workers dropped, every listed node online.
 * @example toTdarrNodes(await getNodes()).map((node) => node.name)
 */
export function toTdarrNodes(raw: Record<string, RawTdarrNode>): TdarrNode[] {
  return Object.values(raw).map(toTdarrNode)
}
