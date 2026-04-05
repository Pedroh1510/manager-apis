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

  it('renders navigation links for Anime RSS', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )
    const statusLinks = screen.getAllByRole('link', { name: /status/i })
    expect(statusLinks.length).toBeGreaterThan(0)
  })
})
