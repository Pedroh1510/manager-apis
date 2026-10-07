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

const FRIEREN_E28 = '[MANUAL] Frieren S01E28 [1080p] [portugues]'
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

function fill(title: string, magnet: string, season = '1', episode = '28') {
  change('Título', title)
  change('Temporada', season)
  change('Episódio', episode)
  change('Magnet', magnet)
}

beforeEach(() => vi.resetAllMocks())

describe('AddRssItemDrawer', () => {
  it('enables submit only for a title, valid season/episode and a valid magnet', () => {
    renderDrawer()
    expect(submit()).toBeDisabled()

    fill('', HEX_MAGNET)
    expect(submit()).toBeDisabled()
    fill('Frieren', HEX_MAGNET, '', '28')
    expect(submit()).toBeDisabled()
    fill('Frieren', HEX_MAGNET, '1', '0')
    expect(submit()).toBeDisabled()
    fill('Frieren', 'http://x')
    expect(submit()).toBeDisabled()
    expect(screen.getByText('Informe um magnet link (magnet:?xt=urn:btih:…)')).toBeInTheDocument()
    fill('Frieren', 'magnet:?xt=urn:btih:abc')
    expect(submit()).toBeDisabled()

    fill('Frieren', HEX_MAGNET, '0', '1')
    expect(submit()).toBeEnabled()
    fill('Frieren', `magnet:?xt=urn:btih:${'A2'.repeat(16)}`)
    expect(submit()).toBeEnabled()
  })

  it('previews the composed title with format and optional codec', () => {
    renderDrawer()
    const preview = screen.getByTestId('rss-item-title-preview')
    expect(preview).toHaveTextContent('—')

    fill('Frieren', HEX_MAGNET, '1', '5')
    expect(preview).toHaveTextContent('[MANUAL] Frieren S01E05 [1080p] [portugues]')
    change('Formato', '720p')
    change('Codec', 'x265')
    expect(preview).toHaveTextContent('[MANUAL] Frieren S01E05 [720p] [x265] [portugues]')
    change('Codec', '')
    expect(preview).toHaveTextContent('[MANUAL] Frieren S01E05 [720p] [portugues]')
  })

  it('hides episode fields and sends prefix + language in title-only mode', async () => {
    vi.mocked(api.createRssItem).mockResolvedValue({ id: 1, title: '', magnet: HEX_MAGNET, pubDate: '' })
    renderDrawer()

    fireEvent.click(screen.getByLabelText('Somente título'))
    expect(screen.queryByLabelText('Temporada')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Formato')).not.toBeInTheDocument()
    change('Título', 'Frieren Movie')
    change('Magnet', HEX_MAGNET)
    fireEvent.click(submit())

    await waitFor(() => expect(api.createRssItem).toHaveBeenCalledWith({ title: '[MANUAL] Frieren Movie [portugues]', magnet: HEX_MAGNET }))
    await waitFor(() => expect(screen.getByLabelText('Título')).toHaveFocus())
  })

  it('blocks submit when the composed title exceeds 500 characters', () => {
    renderDrawer()
    fill('a'.repeat(470), HEX_MAGNET)
    const length = `[MANUAL] ${'a'.repeat(470)} S01E28 [1080p] [portugues]`.length

    expect(submit()).toBeDisabled()
    expect(screen.getByText(`Título final excede 500 caracteres (${length})`)).toBeInTheDocument()
  })

  it('stays open, keeps the series and moves to the next episode after creating', async () => {
    vi.mocked(api.createRssItem).mockResolvedValue({ id: 1, title: FRIEREN_E28, magnet: HEX_MAGNET, pubDate: '' })
    const { onClose, queryClient } = renderDrawer()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    fill('Frieren', HEX_MAGNET)
    change('Codec', 'x265')
    fireEvent.click(submit())

    expect(await screen.findByRole('status')).toHaveTextContent('Item adicionado ao feed')
    expect(api.createRssItem).toHaveBeenCalledWith({ title: '[MANUAL] Frieren S01E28 [1080p] [x265] [portugues]', magnet: HEX_MAGNET })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['anime-rss', 'rss'] })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Título')).toHaveValue('Frieren')
    expect(screen.getByLabelText('Temporada')).toHaveValue(1)
    expect(screen.getByLabelText('Codec')).toHaveValue('x265')
    expect(screen.getByLabelText('Magnet')).toHaveValue('')
    expect(screen.getByLabelText('Episódio')).toHaveValue(29)
    await waitFor(() => expect(screen.getByLabelText('Episódio')).toHaveFocus())
  })

  it('shows the duplicate message on 409', async () => {
    vi.mocked(api.createRssItem).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { statusCode: 409, message: `Torrent with title ${FRIEREN_E28} already exists` } },
      message: 'x',
    })
    const { onClose } = renderDrawer()

    fill('Frieren', HEX_MAGNET)
    fireEvent.click(submit())

    expect(await screen.findByText('Já existe item com esse título')).toBeInTheDocument()
    expect(api.createRssItem).toHaveBeenCalledWith({ title: FRIEREN_E28, magnet: HEX_MAGNET })
    expect(screen.getByLabelText('Título')).toHaveValue('Frieren')
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

    fill('Frieren', HEX_MAGNET)
    fireEvent.click(submit())
    expect(await screen.findByText(message)).toBeInTheDocument()

    fireEvent.click(submit())
    expect(await screen.findByText('Network Error')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('prevents a double submit', async () => {
    vi.mocked(api.createRssItem).mockReturnValue(new Promise(() => {}))
    renderDrawer()

    fill('Frieren', HEX_MAGNET)
    fireEvent.click(submit())
    fireEvent.click(submit())

    await waitFor(() => expect(submit()).toBeDisabled())
    expect(api.createRssItem).toHaveBeenCalledTimes(1)
  })
})
