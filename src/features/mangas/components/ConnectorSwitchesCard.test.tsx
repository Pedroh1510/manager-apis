import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConnectorSwitchesCard } from './ConnectorSwitchesCard'
import * as api from '../services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api')

const switches = [
  { id: 'mangeek', url: 'https://mangeek', enabled: true, disabledAt: null, disabledReason: null, activeLinks: 12 },
  {
    id: 'wicomix',
    url: 'https://wicomix',
    enabled: false,
    disabledAt: '2026-11-14T15:00:00.000Z',
    disabledReason: 'paywall',
    activeLinks: 3
  }
]

describe('ConnectorSwitchesCard', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(api.fetchConnectorSwitches).mockResolvedValue(switches)
    vi.mocked(api.setConnectorSwitch).mockResolvedValue()
  })

  it('lists each connector with its active link count', async () => {
    renderWithProviders(<ConnectorSwitchesCard />)
    expect(await screen.findByText('mangeek')).toBeInTheDocument()
    expect(screen.getByText('12 links ativos')).toBeInTheDocument()
    expect(screen.getByText('3 links ativos')).toBeInTheDocument()
  })

  it('shows disabled date and reason', async () => {
    renderWithProviders(<ConnectorSwitchesCard />)
    expect(await screen.findByText('desligado em 14/11/2026 — paywall')).toBeInTheDocument()
  })

  it('disabling asks for an optional reason inline and sends it', async () => {
    renderWithProviders(<ConnectorSwitchesCard />)
    fireEvent.click(await screen.findByRole('switch', { name: 'Conector mangeek' }))
    fireEvent.change(screen.getByLabelText('Motivo (opcional)'), { target: { value: 'fora do ar' } })
    fireEvent.click(screen.getByRole('button', { name: 'Desligar' }))
    await waitFor(() =>
      expect(api.setConnectorSwitch).toHaveBeenCalledWith('mangeek', { enabled: false, reason: 'fora do ar' })
    )
  })

  it('cancel closes the reason form without sending', async () => {
    renderWithProviders(<ConnectorSwitchesCard />)
    fireEvent.click(await screen.findByRole('switch', { name: 'Conector mangeek' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByLabelText('Motivo (opcional)')).not.toBeInTheDocument()
    expect(api.setConnectorSwitch).not.toHaveBeenCalled()
  })

  it('enabling sends enabled true right away', async () => {
    renderWithProviders(<ConnectorSwitchesCard />)
    fireEvent.click(await screen.findByRole('switch', { name: 'Conector wicomix' }))
    await waitFor(() => expect(api.setConnectorSwitch).toHaveBeenCalledWith('wicomix', { enabled: true }))
  })
})
