import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QbittorrentStatusSection } from './QbittorrentStatusSection'
import * as configApi from '../../server-config/services/api'
import * as torrentsApi from '../../torrents/services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../../server-config/services/api')
vi.mock('../../torrents/services/api')

const section = () => screen.getByRole('heading', { name: 'qBittorrent', level: 2 }).closest('section') as HTMLElement
const valueOf = (label: string) => within(section()).getByText(label).nextElementSibling?.textContent

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: true, sonarr: false })
})

describe('QbittorrentStatusSection', () => {
  it('shows version, counts and speeds when online', async () => {
    vi.mocked(torrentsApi.fetchQbittorrentStatus).mockResolvedValue({
      version: 'v4.6.7', apiVersion: '2.9.3', downloading: 3, completed: 12, downloadSpeed: 2621440, uploadSpeed: 51200,
    })
    renderWithProviders(<QbittorrentStatusSection />)

    expect(await within(section()).findByText('Online')).toBeInTheDocument()
    expect(valueOf('Versão')).toBe('v4.6.7')
    expect(valueOf('API Version')).toBe('2.9.3')
    expect(valueOf('Baixando')).toBe('3')
    expect(valueOf('Concluídos')).toBe('12')
    expect(valueOf('Download')).toBe('2.5 MB/s')
    expect(valueOf('Upload')).toBe('50 KB/s')
  })

  it('shows offline with the server error', async () => {
    vi.mocked(torrentsApi.fetchQbittorrentStatus).mockRejectedValue({
      isAxiosError: true, response: { status: 502, data: { error: 'qBittorrent recusou as credenciais do usuário bob-user' } }, message: 'x',
    })
    renderWithProviders(<QbittorrentStatusSection />)

    expect(await within(section()).findByText('Offline')).toBeInTheDocument()
    expect(within(section()).getByText('qBittorrent recusou as credenciais do usuário bob-user')).toBeInTheDocument()
  })

  it('shows not configured without a badge', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: false })
    renderWithProviders(<QbittorrentStatusSection />)

    expect(await within(section()).findByText('Não configurado')).toBeInTheDocument()
    for (const label of ['Online', 'Offline', 'Verificando...']) {
      expect(within(section()).queryByText(label)).not.toBeInTheDocument()
    }
    expect(torrentsApi.fetchQbittorrentStatus).not.toHaveBeenCalled()
  })
})
