import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { THEME_STORAGE_KEY } from '../../lib/theme'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from './Layout'

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
