import { render as rtlRender, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { THEME_STORAGE_KEY } from '../../lib/theme'
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routes } from '../../router'
import { Layout } from './Layout'
import * as configApi from '../../features/server-config/services/api'
import { createTestQueryClient } from '../../test/renderWithProviders'

vi.mock('../../features/server-config/services/api')
vi.mock('../../features/tdarr/services/api')

// The sidebar reads GET /api/config through TanStack Query.
function render(ui: ReactElement) {
  return rtlRender(<QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: false, sonarrUpload: false, tdarr: false, anilist: false })
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
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: true, sonarr: false, sonarrUpload: false, tdarr: false, anilist: false })
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
      () => Promise.resolve({ qbittorrent: false, sonarr: false, sonarrUpload: false, tdarr: false, anilist: false }),
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

  it('media links follow the configured integrations', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: true, sonarrUpload: false, tdarr: false, anilist: false })
    render(
      <MemoryRouter initialEntries={['/sonarr/faltantes']}>
        <Layout />
      </MemoryRouter>
    )
    await screen.findByRole('link', { name: 'Séries' })
    const mediaSection = screen.getByText('Mídia').closest('div') as HTMLElement
    const mediaLinks = within(mediaSection).getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])
    expect(mediaLinks).toEqual([['Séries', '/sonarr'], ['Calendário', '/sonarr/calendario'], ['Adicionar série', '/sonarr/adicionar'], ['Faltantes', '/sonarr/faltantes'], ['Importar', '/sonarr/importar']])
    expect(screen.getByRole('link', { name: 'Faltantes' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Séries' })).not.toHaveAttribute('aria-current')
    cleanup()

    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: true, sonarr: false, sonarrUpload: false, tdarr: false, anilist: false })
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    await screen.findByRole('link', { name: 'Torrents' })
    for (const name of ['Séries', 'Calendário', 'Adicionar série', 'Faltantes', 'Importar']) expect(screen.queryByRole('link', { name })).not.toBeInTheDocument()
  })

  it('temporadas link follows the anilist flag', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: true, sonarrUpload: false, tdarr: false, anilist: true })
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    const link = await screen.findByRole('link', { name: 'Temporadas' })
    expect(link).toHaveAttribute('href', '/anime/temporadas')
    const mediaSection = screen.getByText('Mídia').closest('div') as HTMLElement
    const labels = within(mediaSection).getAllByRole('link').map((item) => item.textContent)
    expect(labels[labels.indexOf('Importar') + 1]).toBe('Temporadas')
    cleanup()

    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: true, sonarr: true, sonarrUpload: false, tdarr: false, anilist: false })
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    await screen.findByRole('link', { name: 'Torrents' })
    expect(screen.queryByRole('link', { name: 'Temporadas' })).not.toBeInTheDocument()
  })

  it('calendar link sits below series and is the only active one', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: true, sonarrUpload: false, tdarr: false, anilist: false })
    const router = createMemoryRouter(routes, { initialEntries: ['/sonarr/calendario'] })
    render(<RouterProvider router={router} />)
    const calendarLink = await screen.findByRole('link', { name: 'Calendário' })
    const mediaSection = screen.getByText('Mídia').closest('div') as HTMLElement
    const labels = within(mediaSection).getAllByRole('link').map((link) => link.textContent)
    expect(labels.slice(0, 2)).toEqual(['Séries', 'Calendário'])
    expect(calendarLink).toHaveAttribute('href', '/sonarr/calendario')
    expect(within(mediaSection).getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page')).toEqual([calendarLink])
    expect(screen.getByRole('heading', { level: 1, name: 'Calendário' })).toBeInTheDocument()
  })

  it('shows Séries before Torrents when sonarr is configured', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: true, sonarr: true, sonarrUpload: false, tdarr: false, anilist: false })
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    const series = await screen.findByRole('link', { name: 'Séries' })
    expect(series).toHaveAttribute('href', '/sonarr')
    const mediaSection = screen.getByText('Mídia').closest('div') as HTMLElement
    const mediaHrefs = within(mediaSection).getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(mediaHrefs).toEqual(['/sonarr', '/sonarr/calendario', '/sonarr/adicionar', '/sonarr/faltantes', '/sonarr/importar', '/torrents'])
  })

  it('hides Séries unless sonarr is configured and drops an empty media section', async () => {
    const outcomes = [
      () => new Promise<never>(() => {}),
      () => Promise.reject(new Error('offline')),
      () => Promise.resolve({ qbittorrent: true, sonarr: false, sonarrUpload: false, tdarr: false, anilist: false }),
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
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: false, sonarrUpload: false, tdarr: false, anilist: false })
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByText('Mídia')).not.toBeInTheDocument()
  })

  it('highlights Séries on a series detail page', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: false, sonarr: true, sonarrUpload: false, tdarr: false, anilist: false })
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

  it('tdarr link follows the config flag', async () => {
    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: true, sonarr: false, sonarrUpload: false, tdarr: true, anilist: false })
    const router = createMemoryRouter(routes, { initialEntries: ['/tdarr'] })
    render(<RouterProvider router={router} />)
    const tdarrLink = await screen.findByRole('link', { name: 'Tdarr' })
    expect(tdarrLink).toHaveAttribute('href', '/tdarr')
    const mediaSection = screen.getByText('Mídia').closest('div') as HTMLElement
    expect(within(mediaSection).getAllByRole('link').map((link) => link.textContent)).toEqual(['Torrents', 'Tdarr'])
    expect(screen.getByRole('heading', { level: 1, name: 'Tdarr' })).toBeInTheDocument()
    cleanup()

    vi.mocked(configApi.fetchServerConfig).mockResolvedValue({ qbittorrent: true, sonarr: false, sonarrUpload: false, tdarr: false, anilist: false })
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    await screen.findByRole('link', { name: 'Torrents' })
    expect(screen.queryByRole('link', { name: 'Tdarr' })).not.toBeInTheDocument()
  })
})
