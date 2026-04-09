import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
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
})
