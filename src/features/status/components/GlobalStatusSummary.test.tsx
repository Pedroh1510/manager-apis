import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GlobalStatusSummary } from './GlobalStatusSummary'

describe('GlobalStatusSummary', () => {
  it('shows loading badge when any project is loading', () => {
    render(
      <GlobalStatusSummary
        projects={[
          { label: 'Anime RSS', isLoading: true, isSuccess: false },
          { label: 'Mangas Manager', isLoading: false, isSuccess: true },
        ]}
      />
    )
    expect(screen.getByText('Verificando...')).toBeInTheDocument()
  })

  it('shows online badge and success message when all projects are online', () => {
    render(
      <GlobalStatusSummary
        projects={[
          { label: 'Anime RSS', isLoading: false, isSuccess: true },
          { label: 'Mangas Manager', isLoading: false, isSuccess: true },
        ]}
      />
    )
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('Todos os sistemas operacionais')).toBeInTheDocument()
  })

  it('shows offline badge and count when one project is offline', () => {
    render(
      <GlobalStatusSummary
        projects={[
          { label: 'Anime RSS', isLoading: false, isSuccess: false },
          { label: 'Mangas Manager', isLoading: false, isSuccess: true },
        ]}
      />
    )
    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(screen.getByText('1 sistema(s) com problema')).toBeInTheDocument()
  })

  it('shows correct count when multiple projects are offline', () => {
    render(
      <GlobalStatusSummary
        projects={[
          { label: 'Anime RSS', isLoading: false, isSuccess: false },
          { label: 'Mangas Manager', isLoading: false, isSuccess: false },
        ]}
      />
    )
    expect(screen.getByText('2 sistema(s) com problema')).toBeInTheDocument()
  })
})
