import { render as rtlRender, screen, fireEvent, cleanup } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { THEME_STORAGE_KEY } from '../../lib/theme'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from './Layout'
import * as configApi from '../../features/server-config/services/api'
import { createTestQueryClient } from '../../test/renderWithProviders'

vi.mock('../../features/server-config/services/api')

// The sidebar reads GET /api/config through TanStack Query.
function render(ui: ReactElement) {
  return rtlRender(<QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: false })
})

describe('Layout', () => {
  it('renders the sidebar', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders Anime RSS menu section', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    expect(screen.getByText('Anime RSS')).toBeInTheDocument()
  })

  it('renders Mangas Manager menu section', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    expect(screen.getByText('Mangas Manager')).toBeInTheDocument()
  })

  it('renders exactly one global Status link pointing to /status', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    const statusLinks = screen.getAllByRole('link', { name: /^status$/i })
    expect(statusLinks).toHaveLength(1)
    expect(statusLinks[0]).toHaveAttribute('href', '/status')
  })

  it('does not render per-project status links', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    const allLinks = screen.getAllByRole('link')
    const hrefs = allLinks.map(l => l.getAttribute('href'))
    expect(hrefs).not.toContain('/anime-rss/status')
    expect(hrefs).not.toContain('/mangas/status')
  })

  it('shows the queues link right after status', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs.slice(0, 2)).toEqual(['/status', '/filas'])
    expect(screen.getByRole('link', { name: 'Filas' })).toHaveAttribute('href', '/filas')
  })

  it('highlights Mangas on a manga detail page', () => {
    render(
      <MemoryRouter initialEntries={['/mangas/12']}>
        <Layout />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: 'Mangas' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the media section when qbittorrent is configured', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: true, sonarr: false })
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    expect(await screen.findByText('Mídia')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Torrents' })).toHaveAttribute('href', '/torrents')
  })

  it('hides the media section while loading, on error and when disabled', async () => {
    const outcomes = [
      () => new Promise<never>(() => {}),
      () => Promise.reject(new Error('offline')),
      () => Promise.resolve({ qbittorrent: false, sonarr: false }),
    ]
    for (const outcome of outcomes) {
      vi.mocked(configApi.fetchServerConfig).mockImplementation(outcome)
      render(
        <MemoryRouter>
          <Layout />
        </MemoryRouter>
      )
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(screen.queryByText('Mídia')).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Torrents' })).not.toBeInTheDocument()
      cleanup()
    }
  })

  it('shows Séries before Torrents when sonarr is configured', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: true, sonarr: true })
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    const series = await screen.findByRole('link', { name: 'Séries' })
    expect(series).toHaveAttribute('href', '/sonarr')
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs.indexOf('/sonarr')).toBeLessThan(hrefs.indexOf('/torrents'))
  })

  it('hides Séries unless sonarr is configured and drops an empty media section', async () => {
    const outcomes = [
      () => new Promise<never>(() => {}),
      () => Promise.reject(new Error('offline')),
      () => Promise.resolve({ qbittorrent: true, sonarr: false }),
    ]
    for (const outcome of outcomes) {
      vi.mocked(configApi.fetchServerConfig).mockImplementation(outcome)
      render(
        <MemoryRouter>
          <Layout />
        </MemoryRouter>
      )
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(screen.queryByRole('link', { name: 'Séries' })).not.toBeInTheDocument()
      cleanup()
    }
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: false })
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByText('Mídia')).not.toBeInTheDocument()
  })

  it('highlights Séries on a series detail page', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: true })
    render(
      <MemoryRouter initialEntries={['/sonarr/12']}>
        <Layout />
      </MemoryRouter>
    )
    expect(await screen.findByRole('link', { name: 'Séries' })).toHaveAttribute('aria-current', 'page')
  })

  describe('theme', () => {
    beforeEach(() => {
      localStorage.clear()
      document.documentElement.classList.remove('dark')
    })

    it('toggles and persists the theme', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light')
      render(
        <MemoryRouter>
          <Layout />
        </MemoryRouter>
      )

      fireEvent.click(screen.getByRole('button', { name: /escuro/i }))

      expect(document.documentElement).toHaveClass('dark')
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toEqual('dark')

      cleanup()
      render(
        <MemoryRouter>
          <Layout />
        </MemoryRouter>
      )
      expect(screen.getByRole('button', { name: /claro/i })).toBeInTheDocument()
    })
  })
})
