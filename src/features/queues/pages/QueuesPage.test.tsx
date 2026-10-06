import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueuesPage } from './QueuesPage'
import * as api from '../services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { queue } from '../test/fixtures'

vi.mock('../services/api')

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.fetchMangasQueuesSummary).mockResolvedValue([queue('download')])
  vi.mocked(api.fetchRssQueuesSummary).mockResolvedValue([queue('Scan process')])
})

const MANGAS_URL = `${import.meta.env.VITE_MANGAS_API_URL}/queues`
const RSS_URL = `${import.meta.env.VITE_RSS_API_URL}/queues`

describe('QueuesPage', () => {
  it('selects the tab from the api query param', async () => {
    renderWithProviders(<QueuesPage />, { route: '/filas' })
    expect(screen.getByRole('tab', { name: 'Mangas' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Anime RSS' })).toHaveAttribute('aria-selected', 'false')
  })

  it('selects the tab from the api query param (anime-rss)', async () => {
    renderWithProviders(<QueuesPage />, { route: '/filas?api=anime-rss' })
    expect(screen.getByRole('tab', { name: 'Anime RSS' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByTestId('queue-card-Scan process')).toBeInTheDocument()
  })

  it('embeds the bull-board of the selected API', async () => {
    renderWithProviders(<QueuesPage />, { route: '/filas' })
    expect(screen.getByTitle('Bull Board — Mangas')).toHaveAttribute('src', MANGAS_URL)
    expect(screen.getByRole('link', { name: 'Abrir em nova aba' })).toHaveAttribute('href', MANGAS_URL)
    expect(screen.getByRole('link', { name: 'Abrir em nova aba' })).toHaveAttribute('target', '_blank')

    fireEvent.click(screen.getByRole('tab', { name: 'Anime RSS' }))
    expect(screen.getByTitle('Bull Board — Anime RSS')).toHaveAttribute('src', RSS_URL)
    expect(screen.getByRole('link', { name: 'Abrir em nova aba' })).toHaveAttribute('href', RSS_URL)
  })

  it('writes the selected tab to the URL', () => {
    renderWithProviders(<QueuesPage />, { route: '/filas' })

    fireEvent.click(screen.getByRole('tab', { name: 'Anime RSS' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/filas?api=anime-rss')
    fireEvent.click(screen.getByRole('tab', { name: 'Mangas' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/filas?api=mangas')
  })
})
