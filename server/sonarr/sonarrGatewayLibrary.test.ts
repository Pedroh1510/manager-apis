// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { FakeSonarrApi, type FakeSonarrOptions } from '../test/FakeSonarrApi.js'
import {
  FetchSonarrGateway,
  SonarrGatewayError,
  SonarrLookupNotFoundError,
  SonarrRejectedError,
  SonarrSeriesExistsError,
} from './sonarrGateway.js'
import type { RawMissingPage } from './missingEpisodes.js'
import type { AddSeriesInput, RawLookupSeries } from './seriesLookup.js'

let sonarr: FakeSonarrApi | undefined

afterEach(async () => {
  await sonarr?.close()
  sonarr = undefined
})

async function gatewayFor(options: FakeSonarrOptions) {
  sonarr = await FakeSonarrApi.start(options)
  return new FetchSonarrGateway({ url: sonarr.url, apiKey: 'k3y' })
}

const wire: RawLookupSeries = {
  id: 1, tvdbId: 79126, title: 'The Wire', year: 2002, network: 'HBO', overview: 'Baltimore.',
  genres: ['Crime'], remotePoster: 'https://artworks.thetvdb.com/wire.jpg', seasons: [], images: [],
}
const severance: RawLookupSeries = {
  tvdbId: 371980, title: 'Severance', year: 2022, genres: ['Drama'],
  seasons: [{ seasonNumber: 1, monitored: true }], images: [{ coverType: 'poster', remoteUrl: 'https://x/p.jpg' }],
}
const addInput: AddSeriesInput = {
  tvdbId: 371980, qualityProfileId: 4, rootFolderPath: '/tv', seriesType: 'standard', monitor: 'lastSeason', searchForMissingEpisodes: false,
}

describe('FetchSonarrGateway library', () => {
  it('lookup normalizes results and marks library series', async () => {
    const gateway = await gatewayFor({ lookup: [wire, severance] })
    const results = await gateway.lookupSeries('the wire')

    expect(sonarr!.requests[0].url).toBe('/api/v3/series/lookup?term=the+wire')
    expect(results).toEqual([
      { tvdbId: 79126, title: 'The Wire', year: 2002, network: 'HBO', overview: 'Baltimore.', genres: ['Crime'], remotePoster: 'https://artworks.thetvdb.com/wire.jpg', seriesId: 1 },
      { tvdbId: 371980, title: 'Severance', year: 2022, network: null, overview: null, genres: ['Drama'], remotePoster: null, seriesId: null },
    ])
  })

  it('add options keep only ids, names, paths and free space', async () => {
    const gateway = await gatewayFor({
      qualityProfiles: [{ id: 1, name: 'Any', cutoff: 3, items: [] }],
      rootFolders: [{ path: '/tv', freeSpace: 10, accessible: true, id: 1 } as never],
    })
    expect(await gateway.readAddOptions()).toEqual({ qualityProfiles: [{ id: 1, name: 'Any' }], rootFolders: [{ path: '/tv', freeSpace: 10 }] })
  })

  it('add series rebuilds the body from the tvdb lookup', async () => {
    const gateway = await gatewayFor({ lookup: [wire, severance], addResponse: { id: 7, title: 'Severance' } })
    const id = await gateway.addSeries(addInput)

    expect(id).toBe(7)
    expect(sonarr!.requests[0]).toMatchObject({ method: 'GET', url: '/api/v3/series/lookup?term=tvdb%3A371980' })
    expect(sonarr!.writes).toEqual([expect.objectContaining({
      method: 'POST',
      url: '/api/v3/series',
      body: {
        title: 'Severance', tvdbId: 371980, seasons: severance.seasons, images: severance.images,
        qualityProfileId: 4, rootFolderPath: '/tv', seriesType: 'standard', seasonFolder: true, monitored: true,
        addOptions: { monitor: 'lastSeason', searchForMissingEpisodes: false },
      },
    })])
  })

  it('unknown tvdb id throws without posting', async () => {
    const gateway = await gatewayFor({ lookup: [wire] })
    const failure = gateway.addSeries({ ...addInput, tvdbId: 999 })
    await expect(failure).rejects.toThrow(SonarrLookupNotFoundError)
    await expect(failure).rejects.toThrow('série tvdb 999 não encontrada no Sonarr')
    expect(sonarr!.writes).toEqual([])
  })

  it('sonarr validation errors become duplicate or rejected errors', async () => {
    const exists = [{ errorCode: 'SeriesExistsValidator', errorMessage: 'This series has already been added' }]
    let gateway = await gatewayFor({ lookup: [{ ...wire, id: undefined }], addStatus: 400, addResponse: exists })
    const duplicate = gateway.addSeries({ ...addInput, tvdbId: 79126 })
    await expect(duplicate).rejects.toThrow(SonarrSeriesExistsError)
    await expect(duplicate).rejects.toThrow('série 79126 já está na biblioteca')
    await sonarr!.close()

    const rejected = [{ errorCode: 'RootFolderValidator', errorMessage: 'Invalid path' }, { errorCode: 'X', errorMessage: 'Other' }]
    gateway = await gatewayFor({ lookup: [severance], addStatus: 400, addResponse: rejected })
    const refused = gateway.addSeries(addInput)
    await expect(refused).rejects.toThrow(SonarrRejectedError)
    await expect(refused).rejects.toThrow('Sonarr recusou: Invalid path; Other')
  })

  it('missing asks for one page of monitored episodes, newest first', async () => {
    const missing: RawMissingPage = {
      page: 2, pageSize: 20, totalRecords: 45,
      records: [{ id: 60, seriesId: 1, seasonNumber: 5, episodeNumber: 10, title: '-30-', airDateUtc: '2008-03-10T01:00:00Z', series: { title: 'The Wire' } }],
    }
    const gateway = await gatewayFor({ missing })
    const page = await gateway.listMissing(2)

    const url = new URL(sonarr!.requests[0].url, 'http://fake')
    expect(url.pathname).toBe('/api/v3/wanted/missing')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: '2', pageSize: '20', includeSeries: 'true', monitored: 'true', sortKey: 'airDateUtc', sortDirection: 'descending',
    })
    expect(page).toEqual({
      page: 2, pageSize: 20, totalRecords: 45,
      records: [{ episodeId: 60, seriesId: 1, seriesTitle: 'The Wire', seasonNumber: 5, episodeNumber: 10, title: '-30-', airDateUtc: '2008-03-10T01:00:00Z' }],
    })
  })

  it('bulk episode search sends one EpisodeSearch command', async () => {
    const gateway = await gatewayFor({})
    await gateway.searchEpisodes([60, 59])
    expect(sonarr!.writes).toEqual([expect.objectContaining({ method: 'POST', url: '/api/v3/command', body: { name: 'EpisodeSearch', episodeIds: [60, 59] } })])
  })

  it('search all missing sends a MissingEpisodeSearch command', async () => {
    const gateway = await gatewayFor({})
    await gateway.searchAllMissing()
    expect(sonarr!.writes).toEqual([expect.objectContaining({ method: 'POST', url: '/api/v3/command', body: { name: 'MissingEpisodeSearch', monitored: true } })])
  })

  it('an upstream 500 becomes a gateway error', async () => {
    const gateway = await gatewayFor({ failStatus: 500 })
    const failure = gateway.listMissing(1)
    await expect(failure).rejects.toThrow(SonarrGatewayError)
    await expect(failure).rejects.toThrow(`Sonarr indisponível em ${sonarr!.url}: HTTP 500 em /wanted/missing`)
  })
})
