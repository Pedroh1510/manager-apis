import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SonarrStatusSection } from './SonarrStatusSection'
import * as configApi from '../../server-config/services/api'
import * as sonarrApi from '../../sonarr/services/api'
import type { SonarrStatus } from '../../sonarr/services/types'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../../server-config/services/api')
vi.mock('../../sonarr/services/api')

const section = () => screen.getByRole('heading', { name: 'Sonarr', level: 2 }).closest('section') as HTMLElement
const valueOf = (label: string) => within(section()).getByText(label).nextElementSibling?.textContent

function status(overrides: Partial<SonarrStatus> = {}): SonarrStatus {
  return {
    version: '4.0.9.2244',
    health: [],
    queueCount: 7,
    rootFolders: [{ path: '/tv', freeSpace: 412316860416 }, { path: '/anime', freeSpace: 1610612736 }],
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: true })
})

describe('SonarrStatusSection', () => {
  it('shows version, queue and free space per root folder', async () => {
    vi.mocked(sonarrApi.fetchSonarrStatus).mockResolvedValue(status())
    renderWithProviders(<SonarrStatusSection />)

    expect(await within(section()).findByText('Online')).toBeInTheDocument()
    expect(valueOf('Versão')).toBe('4.0.9.2244')
    expect(valueOf('Fila')).toBe('7')
    expect(within(section()).getByText('/tv').nextElementSibling?.textContent).toBe('384.0 GB livres')
    expect(within(section()).getByText('/anime').nextElementSibling?.textContent).toBe('1.5 GB livres')
  })

  it('lists health items by type and shows none when empty', async () => {
    vi.mocked(sonarrApi.fetchSonarrStatus).mockResolvedValue(status({
      health: [
        { type: 'warning', message: 'Indexer X indisponível' },
        { type: 'error', message: 'Pasta raiz /tv ausente' },
        { type: 'notice', message: 'Atualização disponível' },
      ],
    }))
    const withHealth = renderWithProviders(<SonarrStatusSection />)
    for (const [label, message] of [['Aviso', 'Indexer X indisponível'], ['Erro', 'Pasta raiz /tv ausente'], ['notice', 'Atualização disponível']]) {
      expect((await within(section()).findByText(message)).previousElementSibling?.textContent).toBe(label)
    }
    withHealth.unmount()

    vi.mocked(sonarrApi.fetchSonarrStatus).mockResolvedValue(status({ health: [] }))
    renderWithProviders(<SonarrStatusSection />)
    expect(await within(section()).findByText('Nenhum alerta')).toBeInTheDocument()
  })

  it('shows offline with the server error', async () => {
    vi.mocked(sonarrApi.fetchSonarrStatus).mockRejectedValue({
      isAxiosError: true, response: { status: 502, data: { error: 'Sonarr recusou a API key (SONARR_API_KEY)' } }, message: 'x',
    })
    renderWithProviders(<SonarrStatusSection />)

    expect(await within(section()).findByText('Offline')).toBeInTheDocument()
    expect(within(section()).getByText('Sonarr recusou a API key (SONARR_API_KEY)')).toBeInTheDocument()
  })

  it('shows not configured without a badge', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: false })
    renderWithProviders(<SonarrStatusSection />)

    expect(await within(section()).findByText('Não configurado')).toBeInTheDocument()
    for (const label of ['Online', 'Offline', 'Verificando...']) {
      expect(within(section()).queryByText(label)).not.toBeInTheDocument()
    }
    expect(sonarrApi.fetchSonarrStatus).not.toHaveBeenCalled()
  })
})
