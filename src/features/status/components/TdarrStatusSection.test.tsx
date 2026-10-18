import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/renderWithProviders'
import * as configApi from '../../server-config/services/api'
import * as tdarrApi from '../../tdarr/services/api'
import { tdarrNode, tdarrOverview, tdarrWorker } from '../../tdarr/test/fixtures'
import { TdarrStatusSection } from './TdarrStatusSection'

vi.mock('../../server-config/services/api')
vi.mock('../../tdarr/services/api')

const section = () => screen.getByRole('heading', { name: 'Tdarr', level: 2 }).closest('section') as HTMLElement
const valueOf = (label: string) => within(section()).getByText(label).nextElementSibling?.textContent
const config = (tdarr: boolean) => ({ qbittorrent: false, sonarr: false, sonarrUpload: false, tdarr, jikan: false })

beforeEach(() => vi.resetAllMocks())

describe('TdarrStatusSection', () => {
  it('tdarr section shows not configured, online and offline', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue(config(false))
    const off = renderWithProviders(<TdarrStatusSection />)
    expect(await within(section()).findByText('Não configurado')).toBeInTheDocument()
    expect(tdarrApi.fetchTdarrOverview).not.toHaveBeenCalled()
    off.unmount()

    vi.mocked(configApi.fetchServerConfig).mockResolvedValue(config(true))
    vi.mocked(tdarrApi.fetchTdarrOverview).mockResolvedValue(tdarrOverview([
      tdarrNode({ busyWorkers: 2, workers: [tdarrWorker({ id: 'a' }), tdarrWorker({ id: 'b' })] }),
      tdarrNode({ id: 'cpu', name: 'homelab-cpu', online: false }),
    ]))
    const on = renderWithProviders(<TdarrStatusSection />)
    expect(await within(section()).findByText('Online')).toBeInTheDocument()
    expect(valueOf('Versão')).toBe('2.94.02')
    expect(valueOf('Nodes online')).toBe('1/2')
    expect(valueOf('Workers ativos')).toBe('2')
    on.unmount()

    vi.mocked(tdarrApi.fetchTdarrOverview).mockRejectedValue({
      isAxiosError: true, response: { status: 502, data: { error: 'Tdarr indisponível em http://tdarr:8265: HTTP 500 em /api/v2/status' } }, message: 'x',
    })
    renderWithProviders(<TdarrStatusSection />)
    expect(await within(section()).findByText('Offline')).toBeInTheDocument()
    expect(within(section()).getByText('Tdarr indisponível em http://tdarr:8265: HTTP 500 em /api/v2/status')).toBeInTheDocument()
  })
})
