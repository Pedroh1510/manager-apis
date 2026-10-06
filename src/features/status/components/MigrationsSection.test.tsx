import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MigrationsSection } from './MigrationsSection'
import * as api from '../services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api')

const PENDING = [{ name: '1760000000000_add-x', path: 'src/infra/migrations/1760000000000_add-x.cjs', timestamp: 1760000000000 }]

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.fetchPendingMigrations).mockResolvedValue(PENDING)
})

describe('MigrationsSection', () => {
  it('lists pending migrations by name', async () => {
    renderWithProviders(<MigrationsSection />)

    expect(await screen.findByText('1760000000000_add-x')).toBeInTheDocument()
  })

  it('disables the run button when nothing is pending', async () => {
    vi.mocked(api.fetchPendingMigrations).mockResolvedValue([])
    renderWithProviders(<MigrationsSection />)

    expect(await screen.findByText('Nenhuma migration pendente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Executar migrations' })).toBeDisabled()
  })

  it('runs migrations only after confirmation', async () => {
    vi.mocked(api.runMigrations).mockResolvedValue(PENDING)
    renderWithProviders(<MigrationsSection />)
    await screen.findByText('1760000000000_add-x')

    fireEvent.click(screen.getByRole('button', { name: 'Executar migrations' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('1760000000000_add-x')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(api.runMigrations).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Executar migrations' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(api.runMigrations).toHaveBeenCalledTimes(1))
  })

  it('shows how many migrations ran and refreshes the list', async () => {
    vi.mocked(api.runMigrations).mockResolvedValue([PENDING[0], { ...PENDING[0], name: 'b' }])
    renderWithProviders(<MigrationsSection />)
    await screen.findByText('1760000000000_add-x')
    vi.mocked(api.fetchPendingMigrations).mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Executar migrations' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('2 migrations aplicadas')
    await waitFor(() => expect(api.fetchPendingMigrations).toHaveBeenCalled())
  })

  it('shows the error body and refreshes the list when running fails', async () => {
    vi.mocked(api.runMigrations).mockRejectedValue({ isAxiosError: true, response: { data: 'Something broke!' }, message: 'x' })
    renderWithProviders(<MigrationsSection />)
    await screen.findByText('1760000000000_add-x')
    vi.mocked(api.fetchPendingMigrations).mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Executar migrations' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Something broke!')
    await waitFor(() => expect(api.fetchPendingMigrations).toHaveBeenCalled())
  })

  it('shows the running state', async () => {
    vi.mocked(api.runMigrations).mockReturnValue(new Promise(() => {}))
    renderWithProviders(<MigrationsSection />)
    await screen.findByText('1760000000000_add-x')

    fireEvent.click(screen.getByRole('button', { name: 'Executar migrations' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('button', { name: 'Executando…' })).toBeDisabled()
  })
})
