import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MangasAdminPage } from './AdminPage'
import * as api from '../services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api')

const failure = { isAxiosError: true, response: { data: { message: 'Plugin with id tcb not found' } }, message: 'x' }

async function render(ui: React.ReactElement) {
  const view = renderWithProviders(ui)
  await screen.findAllByRole('option')
  return view
}

describe('MangasAdminPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(api.fetchPlugins).mockResolvedValue([{ id: 'tcb', name: 'TCB Scans' }])
  })

  it('renders plugin selector', async () => {
    await render(<MangasAdminPage />)
    expect(screen.getByLabelText(/plugin/i)).toBeInTheDocument()
  })

  it('renders TCB Scans in plugin selector', async () => {
    await render(<MangasAdminPage />)
    expect(screen.getByRole('option', { name: 'TCB Scans' })).toBeInTheDocument()
  })

  it('renders update mangas button', async () => {
    await render(<MangasAdminPage />)
    expect(screen.getByRole('button', { name: /atualizar mangas/i })).toBeInTheDocument()
  })

  it('renders cookie form', async () => {
    await render(<MangasAdminPage />)
    expect(screen.getByLabelText(/cookie/i)).toBeInTheDocument()
  })

  it('renders credentials form', async () => {
    await render(<MangasAdminPage />)
    expect(screen.getByLabelText(/user.?agent/i)).toBeInTheDocument()
  })

  it('filters plugin list without error', async () => {
    await render(<MangasAdminPage />)
    const filterInput = screen.getByPlaceholderText(/filtrar plugin/i)
    fireEvent.change(filterInput, { target: { value: 'TCB' } })
    expect(screen.getByRole('option', { name: 'TCB Scans' })).toBeInTheDocument()
  })

  it('hides plugins that do not match filter', async () => {
    await render(<MangasAdminPage />)
    const filterInput = screen.getByPlaceholderText(/filtrar plugin/i)
    fireEvent.change(filterInput, { target: { value: 'xyz' } })
    expect(screen.queryByRole('option', { name: 'TCB Scans' })).not.toBeInTheDocument()
  })

  it('does not throw when plugin has no name or id', async () => {
    vi.mocked(api.fetchPlugins).mockResolvedValue([{ id: undefined as unknown as string, name: undefined as unknown as string }])
    await render(<MangasAdminPage />)
    const filterInput = screen.getByPlaceholderText(/filtrar plugin/i)
    expect(() => fireEvent.change(filterInput, { target: { value: 'a' } })).not.toThrow()
  })

  it('keeps cookie, credentials and update actions', async () => {
    vi.mocked(api.updateCookie).mockResolvedValue(undefined)
    vi.mocked(api.updateCredentials).mockResolvedValue(undefined)
    vi.mocked(api.updateMangasByPlugin).mockResolvedValue(undefined)
    await render(<MangasAdminPage />)

    fireEvent.change(screen.getByLabelText('Plugin'), { target: { value: 'tcb' } })
    fireEvent.change(screen.getByLabelText('Cookie'), { target: { value: 'session=1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar cookie' }))
    fireEvent.change(screen.getByLabelText('Login'), { target: { value: 'me' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar credenciais' }))
    fireEvent.click(screen.getByRole('button', { name: /atualizar mangas/i }))

    await waitFor(() => expect(api.updateCookie).toHaveBeenCalledWith({ idPlugin: 'tcb', cookie: 'session=1' }))
    await waitFor(() => expect(api.updateCredentials).toHaveBeenCalledWith({ idPlugin: 'tcb', login: 'me', password: 'pw' }))
    await waitFor(() => expect(api.updateMangasByPlugin).toHaveBeenCalledWith('tcb'))
  })

  it('toasts the result of every mutation', async () => {
    for (const fn of [api.updateCookie, api.updateCredentials, api.updateMangasByPlugin]) {
      vi.mocked(fn).mockResolvedValueOnce(undefined).mockRejectedValueOnce(failure)
    }
    await render(<MangasAdminPage />)
    fireEvent.change(screen.getByLabelText('Plugin'), { target: { value: 'tcb' } })
    fireEvent.change(screen.getByLabelText('Cookie'), { target: { value: 'session=1' } })
    fireEvent.change(screen.getByLabelText('Login'), { target: { value: 'me' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'pw' } })

    for (let round = 0; round < 2; round += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Salvar cookie' }))
      await waitFor(() => expect(api.updateCookie).toHaveBeenCalledTimes(round + 1))
      fireEvent.click(screen.getByRole('button', { name: 'Salvar credenciais' }))
      await waitFor(() => expect(api.updateCredentials).toHaveBeenCalledTimes(round + 1))
      fireEvent.click(screen.getByRole('button', { name: /atualizar mangas/i }))
      await waitFor(() => expect(api.updateMangasByPlugin).toHaveBeenCalledTimes(round + 1))
    }

    await waitFor(() => expect(screen.getAllByRole('status')).toHaveLength(3))
    await waitFor(() =>
      expect(screen.getAllByRole('alert').filter((el) => el.textContent?.includes('Plugin with id tcb not found'))).toHaveLength(3)
    )
  })
})
