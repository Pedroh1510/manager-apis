import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ManualImportPage } from './ManualImportPage'
import * as api from '../services/api'
import * as configApi from '../../server-config/services/api'
import type { ImportCandidate, SeriesSummary, UploadedFile } from '../services/types'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { formatDateTime } from '../../../lib/formatDate'

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  fetchStuckDownloads: vi.fn(),
  fetchUploads: vi.fn(),
  uploadFile: vi.fn(),
  deleteUpload: vi.fn(),
  fetchImportFiles: vi.fn(),
  startManualImport: vi.fn(),
  fetchCommandState: vi.fn(),
  fetchSeriesList: vi.fn(),
}))
vi.mock('../../server-config/services/api')

const fileOf = (name: string, size = 1000) => new File([new Uint8Array(Math.min(size, 10))], name) as File & { size: number }
const sized = (name: string, size: number) => Object.defineProperty(fileOf(name), 'size', { value: size }) as File
const newFile: UploadedFile = { name: 'new.mkv', size: 1610612736, modifiedAt: '2026-10-11T12:00:00Z' }
const candidate: ImportCandidate = {
  path: '/uploads/random 05.mkv', relativePath: 'random 05.mkv', size: 1, seriesId: null, seriesTitle: null, episodes: [],
  quality: 'HDTV-720p', languages: [], releaseGroup: null, rejections: ['Unknown Series'],
}
const summary = (id: number, title: string): SeriesSummary => ({
  id, title, alternateTitles: [], year: 2000, status: 'ended', network: '', episodeFileCount: 0, episodeCount: 0, added: '',
})
const httpError = (error: string) => ({ isAxiosError: true, response: { status: 409, data: { error } }, message: 'x' })

function deferred() {
  let resolve!: () => void
  let reject!: (error: unknown) => void
  const promise = new Promise<void>((ok, fail) => { resolve = ok; reject = fail })
  return { promise, resolve, reject }
}

function renderPage(route = '/sonarr/importar') {
  return renderWithProviders(<ManualImportPage />, { route, path: '/sonarr/importar' })
}

const chooseFiles = async (files: File[]) => {
  const input = (await screen.findByText('Escolher arquivos')).querySelector('input') as HTMLInputElement
  expect(input).toHaveAttribute('multiple')
  fireEvent.change(input, { target: { files } })
}
const rowOf = (name: string) => screen.getByTestId(`upload-${name}`)

beforeEach(() => {
  vi.mocked(configApi.fetchServerConfig).mockReset().mockResolvedValue({ qbittorrent: false, sonarr: true, sonarrUpload: true, tdarr: false, jikan: false })
  vi.mocked(api.fetchStuckDownloads).mockReset().mockResolvedValue([])
  vi.mocked(api.fetchUploads).mockReset().mockResolvedValue([newFile])
  vi.mocked(api.uploadFile).mockReset().mockResolvedValue()
  vi.mocked(api.deleteUpload).mockReset().mockResolvedValue()
  vi.mocked(api.fetchImportFiles).mockReset().mockResolvedValue([candidate])
  vi.mocked(api.startManualImport).mockReset().mockResolvedValue(7)
  vi.mocked(api.fetchCommandState).mockReset().mockResolvedValue({ state: 'completed', message: 'Manually imported 1 files' })
  vi.mocked(api.fetchSeriesList).mockReset().mockResolvedValue([summary(1, 'The Wire'), summary(2, 'Severance')])
})

afterEach(() => vi.useRealTimers())

describe('ManualImportPage upload', () => {
  it('uploads chosen or dropped files one at a time with progress', async () => {
    const first = deferred()
    let reportFirst!: (percent: number) => void
    vi.mocked(api.uploadFile).mockImplementation((file, onProgress) => {
      if (file.name !== 'a.mkv') return Promise.resolve()
      reportFirst = onProgress
      return first.promise
    })
    renderPage()
    await chooseFiles([sized('a.mkv', 1610612736), fileOf('b.mkv')])

    await waitFor(() => expect(api.uploadFile).toHaveBeenCalledTimes(1))
    expect(vi.mocked(api.uploadFile).mock.calls[0][0].name).toBe('a.mkv')
    act(() => reportFirst(40))
    expect(rowOf('a.mkv')).toHaveTextContent('a.mkv')
    expect(rowOf('a.mkv')).toHaveTextContent('1.5 GB')
    expect(rowOf('a.mkv')).toHaveTextContent('40%')
    expect(rowOf('b.mkv')).toHaveTextContent('Na fila')

    await act(async () => first.resolve())
    await waitFor(() => expect(api.uploadFile).toHaveBeenCalledTimes(2))
    expect(vi.mocked(api.uploadFile).mock.calls[1][0].name).toBe('b.mkv')
    await waitFor(() => expect(rowOf('b.mkv')).toHaveTextContent('Enviado'))
    expect(rowOf('a.mkv')).toHaveTextContent('Enviado')

    fireEvent.drop(screen.getByTestId('upload-dropzone'), { dataTransfer: { files: [fileOf('c.mkv')] } })
    await waitFor(() => expect(rowOf('c.mkv')).toHaveTextContent('Enviado'))
    expect(vi.mocked(api.uploadFile).mock.calls[2][0].name).toBe('c.mkv')
  })

  it('a finished upload refreshes the folder and a failure does not stop the queue', async () => {
    vi.mocked(api.uploadFile).mockImplementation((file) => (file.name === 'a.mkv' ? Promise.reject(httpError('a.mkv já existe na pasta de upload')) : Promise.resolve()))
    renderPage()
    await screen.findByText('new.mkv')
    const foldersBefore = vi.mocked(api.fetchUploads).mock.calls.length
    await chooseFiles([fileOf('a.mkv'), fileOf('b.mkv')])
    await waitFor(() => expect(rowOf('b.mkv')).toHaveTextContent('Enviado'))
    expect(rowOf('a.mkv')).toHaveTextContent('a.mkv já existe na pasta de upload')
    await waitFor(() => expect(vi.mocked(api.fetchUploads).mock.calls.length).toBeGreaterThan(foldersBefore))
  })

  it('refuses files the server would refuse without sending them', async () => {
    renderPage()
    await chooseFiles([fileOf('a.txt'), sized('big.mkv', 21474836481), fileOf('ok.mkv')])
    await waitFor(() => expect(rowOf('ok.mkv')).toHaveTextContent('Enviado'))
    expect(rowOf('a.txt')).toHaveTextContent('extensão não aceita: .txt')
    expect(rowOf('big.mkv')).toHaveTextContent('maior que 20 GB')
    expect(vi.mocked(api.uploadFile).mock.calls.map(([file]) => file.name)).toEqual(['ok.mkv'])
  })

  it('lists the upload folder and deletes after confirming', async () => {
    renderPage()
    const folder = (await screen.findByRole('heading', { name: 'Pasta de upload' })).closest('section') as HTMLElement
    const row = (await within(folder).findByText('new.mkv')).closest('li') as HTMLElement
    expect(row).toHaveTextContent('1.5 GB')
    expect(row).toHaveTextContent(formatDateTime(newFile.modifiedAt))
    fireEvent.click(within(row).getByRole('button', { name: 'Excluir new.mkv' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Excluir new.mkv da pasta de upload?')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(api.deleteUpload).not.toHaveBeenCalled()

    const before = vi.mocked(api.fetchUploads).mock.calls.length
    fireEvent.click(within(row).getByRole('button', { name: 'Excluir new.mkv' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(api.deleteUpload).toHaveBeenCalledWith('new.mkv'))
    await waitFor(() => expect(vi.mocked(api.fetchUploads).mock.calls.length).toBeGreaterThan(before))
  })

  it('upload folder shows loading, empty and error states', async () => {
    vi.mocked(api.fetchUploads).mockReturnValue(new Promise(() => {}))
    const loading = renderPage()
    const section = async () => (await screen.findByRole('heading', { name: 'Pasta de upload' })).closest('section') as HTMLElement
    expect(within(await section()).getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
    loading.unmount()

    vi.mocked(api.fetchUploads).mockResolvedValue([])
    const empty = renderPage()
    expect(await within(await section()).findByText('Nenhum arquivo na pasta de upload')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Importar da pasta' })).not.toBeInTheDocument()
    empty.unmount()

    vi.mocked(api.fetchUploads).mockRejectedValue(httpError('upload desligado (SONARR_UPLOAD_DIR ausente)'))
    renderPage()
    expect(await within(await section()).findByText('upload desligado (SONARR_UPLOAD_DIR ausente)')).toBeInTheDocument()
  })

  it('imports from the upload folder with the same drawer', async () => {
    const ready: ImportCandidate = { ...candidate, path: '/uploads/Severance.S02E06.mkv', relativePath: 'Severance.S02E06.mkv', seriesId: 2, episodes: [{ id: 126, seasonNumber: 2, episodeNumber: 6 }] }
    vi.mocked(api.fetchImportFiles).mockResolvedValue([candidate, ready])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Importar da pasta' }))
    const drawer = await screen.findByRole('dialog', { name: 'Importar — Pasta de upload' })
    expect(api.fetchImportFiles).toHaveBeenCalledWith({ source: 'upload' })
    const select = await within(drawer).findByRole('combobox', { name: 'Série de random 05.mkv' })
    await within(select).findByRole('option', { name: 'Severance' })
    expect(select).toHaveValue('')
    expect(within(drawer).getByRole('checkbox', { name: 'Importar Severance.S02E06.mkv' })).toBeChecked()

    fireEvent.click(within(drawer).getByRole('button', { name: 'Importar (1)' }))
    await waitFor(() => expect(api.startManualImport).toHaveBeenCalledWith({ source: 'upload' }, [{ path: '/uploads/Severance.S02E06.mkv', seriesId: 2, episodeIds: [126] }]))
  })

  it('a series in the url preselects it for unrecognized files', async () => {
    renderPage('/sonarr/importar?serie=2')
    fireEvent.click(await screen.findByRole('button', { name: 'Importar da pasta' }))
    const drawer = await screen.findByRole('dialog', { name: 'Importar — Pasta de upload' })
    expect(api.fetchImportFiles).toHaveBeenCalledWith({ source: 'upload', seriesId: 2 })
    const select = await within(drawer).findByRole('combobox', { name: 'Série de random 05.mkv' })
    await within(select).findByRole('option', { name: 'Severance' })
    expect(select).toHaveValue('2')
    expect(within(select.closest('tr') as HTMLElement).getByText('Nenhum', { exact: true })).toBeInTheDocument()
  })

  it('a finished folder import refreshes the upload folder', async () => {
    vi.mocked(api.fetchImportFiles).mockResolvedValue([{ ...candidate, seriesId: 2, episodes: [{ id: 125, seasonNumber: 2, episodeNumber: 5 }] }])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Importar da pasta' }))
    const drawer = await screen.findByRole('dialog', { name: 'Importar — Pasta de upload' })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fireEvent.click(await within(drawer).findByRole('button', { name: 'Importar (1)' }))
    await waitFor(() => expect(api.startManualImport).toHaveBeenCalledWith({ source: 'upload' }, [{ path: '/uploads/random 05.mkv', seriesId: 2, episodeIds: [125] }]))
    const [uploadsBefore, queueBefore] = [vi.mocked(api.fetchUploads).mock.calls.length, vi.mocked(api.fetchStuckDownloads).mock.calls.length]
    await act(() => vi.advanceTimersByTimeAsync(2000))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(vi.mocked(api.fetchUploads).mock.calls.length).toBeGreaterThan(uploadsBefore))
    expect(vi.mocked(api.fetchStuckDownloads).mock.calls.length).toBeGreaterThan(queueBefore)
  })

  it('hides the upload sections when upload is off', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: true, sonarrUpload: false, tdarr: false, jikan: false })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Downloads travados' })).toBeInTheDocument()
    await waitFor(() => expect(configApi.fetchServerConfig).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByRole('heading', { name: 'Enviar arquivos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Pasta de upload' })).not.toBeInTheDocument()
    expect(api.fetchUploads).not.toHaveBeenCalled()
  })
})
