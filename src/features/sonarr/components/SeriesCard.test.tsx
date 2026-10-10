import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SeriesCard } from './SeriesCard'
import type { SeriesSummary } from '../services/types'
import { renderWithProviders } from '../../../test/renderWithProviders'

function series(overrides: Partial<SeriesSummary>): SeriesSummary {
  return { id: 1, title: 'The Wire', alternateTitles: [], year: 2002, status: 'ended', network: 'HBO', episodeFileCount: 60, episodeCount: 60, added: '', ...overrides }
}

describe('SeriesCard', () => {
  it('labels every series status', () => {
    const table: [string, string][] = [['continuing', 'Continuando'], ['ended', 'Encerrada'], ['upcoming', 'Em breve'], ['deleted', 'deleted']]
    for (const [status, label] of table) {
      const { unmount } = renderWithProviders(<SeriesCard series={series({ status })} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })

  it('falls back to initials when the poster fails', () => {
    for (const [title, initials] of [['Ação Total', 'AT'], ['The Wire', 'TW']]) {
      const { unmount } = renderWithProviders(<SeriesCard series={series({ title })} />)
      fireEvent.error(screen.getByRole('img', { name: `Pôster de ${title}` }))
      expect(screen.getByText(initials)).toBeInTheDocument()
      expect(screen.queryByRole('img', { name: `Pôster de ${title}` })).not.toBeInTheDocument()
      unmount()
    }
  })
})
