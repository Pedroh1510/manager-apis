import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddRssItemDrawer } from './AddRssItemDrawer'
import * as api from '../services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api')

const HEX_MAGNET = `magnet:?xt=urn:btih:${'a'.repeat(40)}`
const submit = () => screen.getByRole('button', { name: 'Adicionar' })

function renderDrawer(onClose = vi.fn()) {
  const view = renderWithProviders(<AddRssItemDrawer open onClose={onClose} />)
  return { ...view, onClose }
}

function fill(title: string, magnet: string) {
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: title } })
  fireEvent.change(screen.getByLabelText('Magnet'), { target: { value: magnet } })
}

beforeEach(() => vi.resetAllMocks())

describe('AddRssItemDrawer', () => {
  it('enables submit only for a title and a valid magnet', () => {
    renderDrawer()
    expect(submit()).toBeDisabled()

    fill('', HEX_MAGNET)
    expect(submit()).toBeDisabled()
    fill('Frieren 28', 'http://x')
    expect(submit()).toBeDisabled()
    expect(screen.getByText('Informe um magnet link (magnet:?xt=urn:btih:…)')).toBeInTheDocument()
    fill('Frieren 28', 'magnet:?xt=urn:btih:abc')
    expect(submit()).toBeDisabled()

    fill('Frieren 28', HEX_MAGNET)
    expect(submit()).toBeEnabled()
  })

  it('closes, refreshes and toasts after creating', async () => {
    vi.mocked(api.createRssItem).mockResolvedValue({ id: 1, title: 'Frieren 28', magnet: HEX_MAGNET, pubDate: '' })
    const { onClose, queryClient } = renderDrawer()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    fill('Frieren 28', HEX_MAGNET)
    fireEvent.click(submit())

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(api.createRssItem).toHaveBeenCalledWith({ title: 'Frieren 28', magnet: HEX_MAGNET })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['anime-rss', 'rss'] })
    expect(await screen.findByRole('status')).toHaveTextContent('Item adicionado ao feed')
  })

  it('shows the duplicate message on 409', async () => {
    vi.mocked(api.createRssItem).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { statusCode: 409, message: 'Torrent with title Frieren 28 already exists' } },
      message: 'x',
    })
    const { onClose } = renderDrawer()

    fill('Frieren 28', HEX_MAGNET)
    fireEvent.click(submit())

    expect(await screen.findByText('Já existe item com esse título')).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toHaveValue('Frieren 28')
    expect(screen.getByLabelText('Magnet')).toHaveValue(HEX_MAGNET)
    expect(screen.getByLabelText('Título')).toHaveAccessibleDescription('Já existe item com esse título')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows the API message on other failures', async () => {
    const message = `Invalid magnet link: ${HEX_MAGNET}`
    vi.mocked(api.createRssItem)
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 400, data: { statusCode: 400, message } }, message: 'x' })
      .mockRejectedValueOnce(new Error('Network Error'))
    const { onClose } = renderDrawer()

    fill('Frieren 28', HEX_MAGNET)
    fireEvent.click(submit())
    expect(await screen.findByText(message)).toBeInTheDocument()

    fireEvent.click(submit())
    expect(await screen.findByText('Network Error')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('prevents a double submit', async () => {
    vi.mocked(api.createRssItem).mockReturnValue(new Promise(() => {}))
    renderDrawer()

    fill('Frieren 28', HEX_MAGNET)
    fireEvent.click(submit())
    fireEvent.click(submit())

    await waitFor(() => expect(submit()).toBeDisabled())
    expect(api.createRssItem).toHaveBeenCalledTimes(1)
  })
})
