import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SuggestionsPage } from './SuggestionsPage'
import * as api from '../services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'
import type { CoverSuggestion, CoverSuggestionConflict } from '../services/types'

vi.mock('../services/api')

const API = import.meta.env.VITE_MANGAS_API_URL

function suggestion(idSuggestion: number, overrides: Partial<CoverSuggestion> = {}): CoverSuggestion {
  return {
    idSuggestion,
    idManga: 7,
    title: 'Solo Leveling',
    idPlugin: 'nexustoons',
    idMangaPlugin: `item-${idSuggestion}`,
    titlePlugin: `Candidato ${idSuggestion}`,
    score: 0.913,
    band: 'strong',
    titleSimilarity: 0,
    ...overrides,
  }
}

const conflict: CoverSuggestionConflict = {
  ...suggestion(30, { titlePlugin: 'Duplicado', band: 'possible', score: 0.85 }),
  conflictIdManga: 12,
  conflictTitle: 'Nivelamento Solo',
}

function renderPage() {
  return renderWithProviders(<SuggestionsPage />, { route: '/mangas/sugestoes' })
}

const cards = () => screen.queryAllByTestId('suggestion')
const cardTitled = (title: string) => {
  const card = cards().find((element) => within(element).queryByText(title))
  if (!card) throw new Error(`no suggestion card titled ${title}`)
  return within(card)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.fetchPlugins).mockResolvedValue([
    { id: 'nexustoons', name: 'Nexus Toons' },
    { id: 'mangeek', name: 'Mangeek' },
  ] as never)
  vi.mocked(api.acceptCoverSuggestion).mockResolvedValue()
  vi.mocked(api.dismissCoverSuggestion).mockResolvedValue()
})

describe('SuggestionsPage', () => {
  it('lists suggestions grouped by manga with both covers', async () => {
    vi.mocked(api.fetchCoverSuggestions).mockResolvedValue({
      suggestions: [suggestion(1), suggestion(2, { band: 'possible', score: 0.85, idMangaPlugin: 'pico/marcial' })],
      conflicts: [],
    })
    renderPage()

    await screen.findByText('Candidato 1')
    expect(screen.getAllByTestId('suggestion-group')).toHaveLength(1)
    expect(screen.getByRole('img', { name: 'Capa de Solo Leveling' })).toHaveAttribute('src', `${API}/mangas/adm/7/cover`)
    expect(screen.getByRole('img', { name: 'Capa de Candidato 2' })).toHaveAttribute(
      'src',
      `${API}/mangas/nexustoons/cover/${encodeURIComponent('pico/marcial')}`,
    )
    const first = cardTitled('Candidato 1')
    expect(first.getByText('91%')).toBeInTheDocument()
    expect(first.getByText('Forte')).toBeInTheDocument()
    expect(await first.findByText('Nexus Toons')).toBeInTheDocument()
    expect(cardTitled('Candidato 2').getByText('Possível')).toBeInTheDocument()
  })

  it('accepting removes every suggestion of that manga and connector', async () => {
    vi.mocked(api.fetchCoverSuggestions).mockResolvedValue({
      suggestions: [suggestion(1), suggestion(2), suggestion(3, { idPlugin: 'mangeek', titlePlugin: 'Outro conector' })],
      conflicts: [],
    })
    renderPage()
    await screen.findByText('Candidato 1')

    fireEvent.click(cardTitled('Candidato 1').getByRole('button', { name: 'Aceitar' }))

    await waitFor(() => expect(screen.queryByText('Candidato 1')).not.toBeInTheDocument())
    expect(api.acceptCoverSuggestion).toHaveBeenCalledWith(1)
    expect(screen.queryByText('Candidato 2')).not.toBeInTheDocument()
    expect(screen.getByText('Outro conector')).toBeInTheDocument()
  })

  it('dismissing removes only that suggestion', async () => {
    vi.mocked(api.fetchCoverSuggestions).mockResolvedValue({ suggestions: [suggestion(1), suggestion(2)], conflicts: [] })
    renderPage()
    await screen.findByText('Candidato 1')

    fireEvent.click(cardTitled('Candidato 1').getByRole('button', { name: 'Recusar' }))

    await waitFor(() => expect(screen.queryByText('Candidato 1')).not.toBeInTheDocument())
    expect(api.dismissCoverSuggestion).toHaveBeenCalledWith(1)
    expect(screen.getByText('Candidato 2')).toBeInTheDocument()
  })

  it('keeps the suggestion and shows the api error', async () => {
    vi.mocked(api.fetchCoverSuggestions).mockResolvedValue({ suggestions: [suggestion(1), suggestion(2)], conflicts: [] })
    vi.mocked(api.acceptCoverSuggestion).mockRejectedValue({
      response: { status: 409, data: { message: 'Suggestion is not pending' } },
    })
    vi.mocked(api.dismissCoverSuggestion).mockRejectedValue({
      response: { status: 500, data: 'Something broke!' },
    })
    renderPage()
    await screen.findByText('Candidato 1')

    fireEvent.click(cardTitled('Candidato 1').getByRole('button', { name: 'Aceitar' }))
    expect(await screen.findByText('Suggestion is not pending')).toBeInTheDocument()
    fireEvent.click(cardTitled('Candidato 2').getByRole('button', { name: 'Recusar' }))
    expect(await screen.findByText('Something broke!')).toBeInTheDocument()

    expect(screen.getByText('Candidato 1')).toBeInTheDocument()
    expect(screen.getByText('Candidato 2')).toBeInTheDocument()
  })

  it('shows loading and empty states', async () => {
    vi.mocked(api.fetchCoverSuggestions).mockReturnValueOnce(new Promise(() => {}))
    const { unmount } = renderPage()
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getAllByTestId('placeholder-row').length).toBeGreaterThan(0)
    unmount()

    vi.mocked(api.fetchCoverSuggestions).mockResolvedValue({ suggestions: [], conflicts: [] })
    renderPage()
    expect(await screen.findByText('Nenhuma sugestão pendente')).toBeInTheDocument()
  })

  it('shows conflicts as possible duplicates without accept', async () => {
    vi.mocked(api.fetchCoverSuggestions).mockResolvedValue({ suggestions: [], conflicts: [conflict] })
    renderPage()

    const section = within(await screen.findByRole('region', { name: 'Possíveis duplicatas' }))
    expect(section.getByRole('link', { name: 'Nivelamento Solo' })).toHaveAttribute('href', '/mangas/12')
    expect(section.getByRole('button', { name: 'Recusar' })).toBeInTheDocument()
    expect(section.queryByRole('button', { name: 'Aceitar' })).not.toBeInTheDocument()
  })

  it('retries after a failed load', async () => {
    vi.mocked(api.fetchCoverSuggestions)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({ suggestions: [suggestion(1)], conflicts: [] })
    renderPage()

    const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
    expect(screen.getByText(/Network Error/)).toBeInTheDocument()
    fireEvent.click(retry)

    expect(await screen.findByText('Candidato 1')).toBeInTheDocument()
    expect(api.fetchCoverSuggestions).toHaveBeenCalledTimes(2)
  })
})
