// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FakeSonarrApi, type FakeSonarrOptions } from '../test/FakeSonarrApi.js'
import { FetchSonarrGateway, SonarrCommandNotFoundError, SonarrGatewayError, SonarrImportFileNotFoundError } from './sonarrGateway.js'
import type { RawImportCandidate, RawQueueRecord } from './manualImport.js'

let sonarr: FakeSonarrApi | undefined

afterEach(async () => {
  await sonarr?.close()
  sonarr = undefined
})

async function gatewayFor(options: FakeSonarrOptions) {
  sonarr = await FakeSonarrApi.start(options)
  return new FetchSonarrGateway({ url: sonarr.url, apiKey: 'k3y' })
}

const queueRecord = (overrides: Partial<RawQueueRecord>): RawQueueRecord => ({ title: 'Severance.S02.1080p', size: 4000, ...overrides })
const recognized: RawImportCandidate = {
  path: '/dl/Severance.S02E03.mkv', relativePath: 'Severance.S02E03.mkv', size: 2000000,
  series: { id: 2, title: 'Severance' }, episodes: [{ id: 119, seasonNumber: 2, episodeNumber: 3 }],
  quality: { quality: { name: 'WEBDL-1080p' } }, languages: [{ id: 1, name: 'English' }],
  releaseType: 'singleEpisode', indexerFlags: 0, rejections: [{ reason: 'Unable to determine if file is a sample' }],
}
const unknown: RawImportCandidate = {
  path: '/dl/random name 07.mkv', relativePath: 'random name 07.mkv', size: 1000,
  quality: { quality: { name: 'HDTV-720p' } }, languages: [{ id: 0, name: 'Unknown' }], releaseGroup: 'mi',
  releaseType: 'unknown', indexerFlags: 0, rejections: [{ reason: 'Unknown Series' }],
}

describe('FetchSonarrGateway manual import', () => {
  it('stuck downloads keep only pending or blocked, one per download', async () => {
    const gateway = await gatewayFor({
      queue: [
        queueRecord({
          downloadId: 'D1', trackedDownloadState: 'importBlocked', series: { title: 'Severance' },
          statusMessages: [
            { title: 'One or more episodes expected in this release were not imported', messages: [] },
            { title: 'random name 07.mkv', messages: ['Invalid season or episode'] },
          ],
        }),
        queueRecord({
          downloadId: 'D1', trackedDownloadState: 'importBlocked', series: { title: 'Severance' },
          statusMessages: [{ title: 'random name 07.mkv', messages: ['Invalid season or episode', 'Sample'] }],
        }),
        queueRecord({ downloadId: 'D2', title: 'random', size: 10, trackedDownloadState: 'importPending' }),
        queueRecord({ downloadId: 'D3', trackedDownloadState: 'downloading' }),
      ],
    })
    const stuck = await gateway.listStuckDownloads()

    const url = new URL(sonarr!.requests[0].url, 'http://fake')
    expect(url.pathname).toBe('/api/v3/queue')
    expect(url.searchParams.get('pageSize')).toBe('200')
    expect(url.searchParams.get('includeSeries')).toBe('true')
    expect(stuck).toEqual([
      { downloadId: 'D1', title: 'Severance.S02.1080p', seriesTitle: 'Severance', state: 'importBlocked', size: 4000,
        messages: ['One or more episodes expected in this release were not imported', 'random name 07.mkv: Invalid season or episode', 'random name 07.mkv: Sample'] },
      { downloadId: 'D2', title: 'random', seriesTitle: null, state: 'importPending', messages: [], size: 10 },
    ])
  })

  it('import files normalize the manual import candidates', async () => {
    const gateway = await gatewayFor({ importCandidates: [recognized, unknown] })
    const files = await gateway.listImportFiles('D1')

    expect(sonarr!.requests[0].url).toBe('/api/v3/manualimport?downloadId=D1&filterExistingFiles=true')
    expect(files).toEqual([
      {
        path: '/dl/Severance.S02E03.mkv', relativePath: 'Severance.S02E03.mkv', size: 2000000, seriesId: 2, seriesTitle: 'Severance',
        episodes: [{ id: 119, seasonNumber: 2, episodeNumber: 3 }], quality: 'WEBDL-1080p', languages: ['English'], releaseGroup: null,
        rejections: ['Unable to determine if file is a sample'],
      },
      {
        path: '/dl/random name 07.mkv', relativePath: 'random name 07.mkv', size: 1000, seriesId: null, seriesTitle: null,
        episodes: [], quality: 'HDTV-720p', languages: ['Unknown'], releaseGroup: 'mi', rejections: ['Unknown Series'],
      },
    ])
  })

  it('manual import rebuilds each file from its candidate', async () => {
    const gateway = await gatewayFor({ importCandidates: [recognized, unknown], commandId: 392 })
    const commandId = await gateway.startManualImport('D1', [{ path: '/dl/random name 07.mkv', seriesId: 2, episodeIds: [123, 124] }])

    expect(commandId).toBe(392)
    expect(sonarr!.requests[0]).toMatchObject({ method: 'GET', url: '/api/v3/manualimport?downloadId=D1&filterExistingFiles=true' })
    expect(sonarr!.writes).toEqual([expect.objectContaining({
      method: 'POST',
      url: '/api/v3/command',
      body: {
        name: 'ManualImport',
        importMode: 'auto',
        files: [{
          path: '/dl/random name 07.mkv', seriesId: 2, episodeIds: [123, 124], downloadId: 'D1',
          quality: unknown.quality, languages: unknown.languages, releaseGroup: 'mi', releaseType: 'unknown', indexerFlags: 0,
        }],
      },
    })])
  })

  it('unknown path throws without sending the command', async () => {
    const gateway = await gatewayFor({ importCandidates: [recognized] })
    const failure = gateway.startManualImport('D1', [{ path: '/dl/outro.mkv', seriesId: 2, episodeIds: [1] }])
    await expect(failure).rejects.toThrow(SonarrImportFileNotFoundError)
    await expect(failure).rejects.toThrow('arquivo não encontrado no download D1: /dl/outro.mkv')
    expect(sonarr!.writes).toEqual([])
  })

  it('reads a command state and maps a missing command', async () => {
    const gateway = await gatewayFor({ commands: { 392: { status: 'completed', result: 'successful', message: 'Manually imported 1 files' } } })
    expect(await gateway.readCommand(392)).toEqual({ state: 'completed', message: 'Manually imported 1 files' })
    expect(sonarr!.requests[0].url).toBe('/api/v3/command/392')

    const missing = gateway.readCommand(7)
    await expect(missing).rejects.toThrow(SonarrCommandNotFoundError)
    await expect(missing).rejects.toThrow('comando 7 não encontrado no Sonarr')
  })

  it('an upstream 500 on the queue becomes a gateway error', async () => {
    const gateway = await gatewayFor({ failStatus: 500 })
    const failure = gateway.listStuckDownloads()
    await expect(failure).rejects.toThrow(SonarrGatewayError)
    await expect(failure).rejects.toThrow(`Sonarr indisponível em ${sonarr!.url}: HTTP 500 em /queue`)
  })
})
