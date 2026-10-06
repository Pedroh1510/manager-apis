import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AnimeRssAdminPage } from './AdminPage'
import * as api from '../services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api')

const NARUTO = { hash: 'abc', name: 'Naruto EP1', state: 'downloading', progress: 0.5, size: 1024, dlspeed: 100 }
const failure = { isAxiosError: true, response: { data: { message: 'qbittorrent offline' } }, message: 'x' }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.fetchTorrents).mockResolvedValue([NARUTO])
  vi.mocked(api.fetchConcludedTorrents).mockResolvedValue([])
})

const confirm = () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }))

describe('AnimeRssAdminPage', () => {
  it('renders active torrents table', async () => {
    renderWithProviders(<AnimeRssAdminPage />)
    expect(await screen.findByText('Naruto EP1')).toBeInTheDocument()
  })

  it('shows delete all torrents button', async () => {
    vi.mocked(api.fetchTorrents).mockResolvedValue([])
    renderWithProviders(<AnimeRssAdminPage />)
    expect(await screen.findByRole('button', { name: /deletar todos/i })).toBeInTheDocument()
  })

  it('opens confirm dialog when deleting a torrent', async () => {
    renderWithProviders(<AnimeRssAdminPage />)
    fireEvent.click(await screen.findByRole('button', { name: /deletar naruto ep1/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('destructive actions still require confirmation', async () => {
    vi.mocked(api.deleteTorrent).mockResolvedValue(undefined)
    vi.mocked(api.deleteAllTorrents).mockResolvedValue(undefined)
    renderWithProviders(<AnimeRssAdminPage />)

    fireEvent.click(await screen.findByRole('button', { name: /deletar naruto ep1/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: /deletar todos/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(api.deleteTorrent).not.toHaveBeenCalled()
    expect(api.deleteAllTorrents).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /deletar naruto ep1/i }))
    confirm()
    fireEvent.click(screen.getByRole('button', { name: /deletar todos/i }))
    confirm()
    await waitFor(() => expect(api.deleteTorrent).toHaveBeenCalledWith('abc'))
    await waitFor(() => expect(api.deleteAllTorrents).toHaveBeenCalledTimes(1))
  })

  it('toasts the result of every mutation', async () => {
    vi.mocked(api.stopTorrent).mockResolvedValueOnce(undefined).mockRejectedValueOnce(failure)
    vi.mocked(api.deleteTorrent).mockResolvedValueOnce(undefined).mockRejectedValueOnce(failure)
    vi.mocked(api.deleteAllTorrents).mockResolvedValueOnce(undefined).mockRejectedValueOnce(failure)
    renderWithProviders(<AnimeRssAdminPage />)
    await screen.findByText('Naruto EP1')

    for (let round = 0; round < 2; round += 1) {
      fireEvent.click(screen.getByRole('button', { name: /pausar naruto ep1/i }))
      fireEvent.click(screen.getByRole('button', { name: /deletar naruto ep1/i }))
      confirm()
      fireEvent.click(screen.getByRole('button', { name: /deletar todos/i }))
      confirm()
      await waitFor(() => expect(api.deleteAllTorrents).toHaveBeenCalledTimes(round + 1))
    }

    await waitFor(() => expect(screen.getAllByRole('status')).toHaveLength(3))
    await waitFor(() =>
      expect(screen.getAllByRole('alert').filter((el) => el.textContent?.includes('qbittorrent offline'))).toHaveLength(3)
    )
  })
})
