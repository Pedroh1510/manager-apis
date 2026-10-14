// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { toTdarrNodes, type RawTdarrNode, type RawTdarrWorker } from './tdarrNodes.js'

const worker = (id: string, workerType: string, extra: Partial<RawTdarrWorker> = {}): RawTdarrWorker => ({
  _id: id,
  workerType,
  file: `/media/${id}.mkv`,
  percentage: 10,
  ETA: '0:01:00',
  fps: 100,
  idle: false,
  originalfileSizeInGbytes: 2,
  estSize: 1,
  ...extra,
})

const node = (id: string, extra: Partial<RawTdarrNode> = {}): RawTdarrNode => ({
  _id: id,
  nodeName: id,
  nodePaused: false,
  workerLimits: { transcodegpu: 0, transcodecpu: 0, healthcheckgpu: 0, healthcheckcpu: 0 },
  workers: {},
  ...extra,
})

describe('toTdarrNodes', () => {
  it('every listed node is online, since get-nodes only lists connected nodes', () => {
    const nodes = toTdarrNodes({ a: node('a'), b: node('b', { nodePaused: true }) })
    expect(nodes.map(({ id, online }) => ({ id, online }))).toEqual([
      { id: 'a', online: true },
      { id: 'b', online: true },
    ])
  })

  it('maps active workers and counts capacity', () => {
    const raw = node('pc', {
      nodeName: 'pc-rtx2060',
      nodePaused: true,
      workerLimits: { transcodegpu: 2, transcodecpu: 0, healthcheckgpu: 0, healthcheckcpu: 1 },
      workers: {
        w1: worker('w1', 'transcodegpu', { file: '/movies/Z.mkv', percentage: 72.9, ETA: '0:04:16', fps: 189, originalfileSizeInGbytes: 2.83, estSize: 2.49 }),
        w2: worker('w2', 'transcodecpu'),
        w3: worker('w3', 'healthcheckgpu'),
        w4: worker('w4', 'healthcheckcpu'),
        idle: worker('idle', 'transcodegpu', { idle: true }),
      },
    })

    const [mapped] = toTdarrNodes({ pc: raw })

    expect(mapped).toMatchObject({
      id: 'pc',
      name: 'pc-rtx2060',
      paused: true,
      busyWorkers: 4,
      workerCapacity: 3,
      workerLimits: { transcodeGpu: 2, transcodeCpu: 0, healthCheckGpu: 0, healthCheckCpu: 1 },
    })
    expect(mapped.workers[0]).toEqual({
      id: 'w1', kind: 'transcode', hardware: 'gpu', file: '/movies/Z.mkv', percentage: 72.9, eta: '0:04:16', fps: 189, originalSizeGb: 2.83, estimatedSizeGb: 2.49,
    })
    expect(mapped.workers.map(({ kind, hardware }) => `${kind}/${hardware}`)).toEqual([
      'transcode/gpu', 'transcode/cpu', 'healthCheck/gpu', 'healthCheck/cpu',
    ])
  })
})
