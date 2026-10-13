import { act, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/renderWithProviders'
import * as api from '../services/api'
import { EMPTY_ERRORS, tdarrNode, tdarrOverview, tdarrStats, tdarrWorker } from '../test/fixtures'
import { TdarrPage } from './TdarrPage'

vi.mock('../services/api')

const httpError = (status: number, error: string) => ({ isAxiosError: true, response: { status, data: { error } }, message: 'x' })
const nodeCard = (name: string) => screen.getByRole('heading', { name, level: 3 }).closest('article') as HTMLElement
const block = (name: string) => screen.getByRole('region', { name })
const counter = (scope: HTMLElement, label: string) => within(scope).getByText(label).nextElementSibling?.textContent

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.fetchTdarrOverview).mockResolvedValue(tdarrOverview())
  vi.mocked(api.fetchTdarrStats).mockResolvedValue(tdarrStats())
})

afterEach(() => {
  vi.useRealTimers()
  setVisibility('visible')
})

describe('TdarrPage', () => {
  it('node cards show state, workers and limits', async () => {
    vi.mocked(api.fetchTdarrOverview).mockResolvedValue(tdarrOverview([
      tdarrNode({
        name: 'pc-rtx2060', busyWorkers: 2, workerCapacity: 3, workers: [tdarrWorker({ id: 'a' }), tdarrWorker({ id: 'b' })],
        workerLimits: { transcodeGpu: 2, transcodeCpu: 0, healthCheckGpu: 0, healthCheckCpu: 1 },
      }),
      tdarrNode({ id: 'cpu', name: 'homelab-cpu', paused: true, online: false, busyWorkers: 0, workerCapacity: 1 }),
    ]))
    renderWithProviders(<TdarrPage />)

    await screen.findByRole('heading', { name: 'pc-rtx2060', level: 3 })
    const pc = nodeCard('pc-rtx2060')
    expect(within(pc).getByText('Ativo')).toBeInTheDocument()
    expect(within(pc).getByText('Online')).toBeInTheDocument()
    expect(within(pc).getByText('2/3 workers ocupados')).toBeInTheDocument()
    expect(counter(pc, 'Transcode GPU')).toBe('2')
    expect(counter(pc, 'Transcode CPU')).toBe('0')
    expect(counter(pc, 'Health check GPU')).toBe('0')
    expect(counter(pc, 'Health check CPU')).toBe('1')
    const cpu = nodeCard('homelab-cpu')
    expect(within(cpu).getByText('Pausado')).toBeInTheDocument()
    expect(within(cpu).getByText('Offline')).toBeInTheDocument()
    expect(within(cpu).getByText('0/1 workers ocupados')).toBeInTheDocument()
  })

  it('worker shows file, progress, eta, fps, type and sizes', async () => {
    const path = '/movies/Zootopia 2 (2025)/Zootopia 2 (2025) WEBDL-1080p.mkv'
    vi.mocked(api.fetchTdarrOverview).mockResolvedValue(tdarrOverview([tdarrNode({
      name: 'pc-rtx2060', busyWorkers: 1,
      workers: [tdarrWorker({ file: path, percentage: 72.9, eta: '0:04:16', fps: 189, originalSizeGb: 2.8299, estimatedSizeGb: 2.4886 })],
    })]))
    renderWithProviders(<TdarrPage />)

    const name = await screen.findByText('Zootopia 2 (2025) WEBDL-1080p.mkv')
    expect(name).toHaveAttribute('title', path)
    const worker = name.closest('li') as HTMLElement
    expect(within(worker).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '72.9')
    for (const text of ['72,9%', '0:04:16', '189 fps', 'Transcode GPU', 'pc-rtx2060', '2,83 GB → 2,49 GB']) {
      expect(within(worker).getByText(text)).toBeInTheDocument()
    }
  })

  it('no active worker message', async () => {
    renderWithProviders(<TdarrPage />)
    expect(await screen.findByText('Nenhum worker ativo')).toBeInTheDocument()
  })

  it('stats show totals and counters', async () => {
    renderWithProviders(<TdarrPage />)
    await screen.findByText('592,95 GB')
    const totals = block('Totais')
    expect(counter(totals, 'Arquivos')).toBe('2816')
    expect(counter(totals, 'Transcodes')).toBe('3278')
    expect(counter(totals, 'Health checks')).toBe('5310')
    expect(counter(totals, 'Espaço economizado')).toBe('592,95 GB')
    const transcode = block('Transcode')
    expect([['Em espera', '1'], ['Na fila', '48'], ['Sucesso', '2766'], ['Erro', '3']].map(([label]) => [label, counter(transcode, label)]))
      .toEqual([['Em espera', '1'], ['Na fila', '48'], ['Sucesso', '2766'], ['Erro', '3']])
    const health = block('Health check')
    expect([['Na fila', '4'], ['Sucesso', '2814'], ['Erro', '6']].map(([label]) => [label, counter(health, label)]))
      .toEqual([['Na fila', '4'], ['Sucesso', '2814'], ['Erro', '6']])
  })

  it('error lists show items, overflow note and empty state', async () => {
    const items = Array.from({ length: 50 }, (_, index) => ({ file: `/series/tv/Show/E${index}.mkv`, library: 'series', date: index === 1 ? null : '2026-10-12T10:00:00.000Z' }))
    vi.mocked(api.fetchTdarrStats).mockResolvedValue(tdarrStats({ errors: { transcode: { total: 73, items }, healthCheck: EMPTY_ERRORS } }))
    renderWithProviders(<TdarrPage />)

    await screen.findByText('mostrando 50 de 73')
    const transcode = block('Erros de transcode')
    expect(within(transcode).getAllByRole('listitem')).toHaveLength(50)
    const first = within(transcode).getByText('E0.mkv')
    expect(first).toHaveAttribute('title', '/series/tv/Show/E0.mkv')
    const firstRow = first.closest('li') as HTMLElement
    expect(within(firstRow).getByText('series')).toBeInTheDocument()
    expect(within(firstRow).getByText('12/10/2026 07:00')).toBeInTheDocument()
    expect(within(within(transcode).getByText('E1.mkv').closest('li') as HTMLElement).getByText('—')).toBeInTheDocument()
    const health = block('Erros de health check')
    expect(within(health).getByText('Nenhum erro')).toBeInTheDocument()
    expect(within(health).queryByText(/mostrando/)).not.toBeInTheDocument()
  })

  it('polls overview every 5s and stats every 60s only while visible', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderWithProviders(<TdarrPage />)
    await act(() => vi.advanceTimersByTimeAsync(100))
    expect(api.fetchTdarrOverview).toHaveBeenCalledTimes(1)
    expect(api.fetchTdarrStats).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(5000))
    expect(api.fetchTdarrOverview).toHaveBeenCalledTimes(2)
    expect(api.fetchTdarrStats).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(55000))
    expect(api.fetchTdarrStats).toHaveBeenCalledTimes(2)

    setVisibility('hidden')
    const overviewCalls = vi.mocked(api.fetchTdarrOverview).mock.calls.length
    await act(() => vi.advanceTimersByTimeAsync(60000))
    expect(api.fetchTdarrOverview).toHaveBeenCalledTimes(overviewCalls)
    expect(api.fetchTdarrStats).toHaveBeenCalledTimes(2)
  })

  it('each block loads and fails on its own', async () => {
    vi.mocked(api.fetchTdarrOverview).mockReturnValue(new Promise(() => {}))
    vi.mocked(api.fetchTdarrStats).mockReturnValue(new Promise(() => {}))
    const pending = renderWithProviders(<TdarrPage />)
    expect(screen.getAllByRole('status', { name: 'Carregando' })).toHaveLength(2)
    pending.unmount()

    vi.mocked(api.fetchTdarrOverview).mockRejectedValue(httpError(502, 'Tdarr falhou: timeout'))
    vi.mocked(api.fetchTdarrStats).mockResolvedValue(tdarrStats())
    const overviewDown = renderWithProviders(<TdarrPage />)
    expect(await screen.findByText('Tdarr falhou: timeout')).toBeInTheDocument()
    expect(await screen.findByText('592,95 GB')).toBeInTheDocument()
    overviewDown.unmount()

    vi.mocked(api.fetchTdarrOverview).mockResolvedValue(tdarrOverview())
    vi.mocked(api.fetchTdarrStats).mockRejectedValue(httpError(502, 'Tdarr falhou: timeout'))
    renderWithProviders(<TdarrPage />)
    expect(await screen.findByText('Tdarr falhou: timeout')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'pc-rtx2060', level: 3 })).toBeInTheDocument()
  })
})
