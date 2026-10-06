import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LocationDisplay } from '../../../test/renderWithProviders'
import { describe, expect, it, vi } from 'vitest'
import { MangasTable } from './MangasTable'
import { connector, manga, PLUGIN_NAMES } from '../test/fixtures'
import type { MangaListItem } from '../services/types'

function renderTable(mangas: MangaListItem[], pendingMangaId: number | null = null) {
  const handlers = {
    onSetAllConnectorsActive: vi.fn(),
    onSetConnectorActive: vi.fn(),
    onDelete: vi.fn(),
  }
  render(
    <MemoryRouter>
      <MangasTable mangas={mangas} pluginNames={PLUGIN_NAMES} pendingMangaId={pendingMangaId} {...handlers} />
      <LocationDisplay />
    </MemoryRouter>
  )
  return handlers
}

const row = (title: string) => screen.getByText(title).closest('tr') as HTMLElement

describe('MangasTable', () => {
  it('renders title, one chip per connector and the derived status', () => {
    renderTable([manga(1, 'Naruto', [connector('tcb', true, 'Naruto TCB'), connector('mangeek', false)])])

    const naruto = within(row('Naruto'))
    expect(naruto.getByTestId('connector-chip-tcb')).toHaveTextContent('TCB')
    expect(naruto.getByTestId('connector-chip-tcb')).toHaveAttribute('data-active', 'true')
    expect(naruto.getByTestId('connector-chip-mangeek')).toHaveTextContent('Mangeek')
    expect(naruto.getByTestId('connector-chip-mangeek')).toHaveAttribute('data-active', 'false')
    expect(naruto.getByText('Parcial')).toBeInTheDocument()
    expect(naruto.getByTestId('connector-chip-tcb')).toHaveAttribute('title', 'Naruto TCB')
  })

  it('falls back to idPlugin when the plugin has no name', () => {
    renderTable([manga(1, 'Naruto', [connector('desconhecido', true, 'Naruto X')])])

    expect(within(row('Naruto')).getByTestId('connector-chip-desconhecido')).toHaveTextContent('desconhecido')
  })

  it('general toggle sends the opposite of the derived status', () => {
    const handlers = renderTable([
      manga(1, 'Ligado', [connector('tcb', true)]),
      manga(2, 'Misto', [connector('tcb', true), connector('mangeek', false)]),
      manga(3, 'Desligado', [connector('tcb', false)]),
    ])

    for (const title of ['Ligado', 'Misto', 'Desligado']) {
      fireEvent.click(within(row(title)).getByRole('switch', { name: `Ativar ou desativar ${title}` }))
    }

    expect(handlers.onSetAllConnectorsActive.mock.calls).toEqual([
      [1, false],
      [2, false],
      [3, true],
    ])
  })

  it('shows per-connector toggles only when there is more than one connector', () => {
    const handlers = renderTable([
      manga(1, 'Bleach', [connector('tcb', true), connector('mangeek', true)]),
      manga(2, 'Solo', [connector('tcb', true)]),
    ])

    fireEvent.click(within(row('Bleach')).getByRole('switch', { name: 'Conector Mangeek de Bleach' }))
    expect(handlers.onSetConnectorActive).toHaveBeenCalledWith(1, 'mangeek', false)
    expect(within(row('Solo')).getAllByRole('switch')).toHaveLength(1)
  })

  it('disables only the toggles of the manga being updated', () => {
    renderTable(
      [
        manga(1, 'Primeiro', [connector('tcb', true), connector('mangeek', true)]),
        manga(2, 'Segundo', [connector('tcb', true), connector('mangeek', true)]),
      ],
      1
    )

    for (const toggle of within(row('Primeiro')).getAllByRole('switch')) expect(toggle).toBeDisabled()
    for (const toggle of within(row('Segundo')).getAllByRole('switch')) expect(toggle).toBeEnabled()
  })

  it('disables the general toggle for a manga with no connector', () => {
    const handlers = renderTable([manga(1, 'Vazio', [])])

    const vazio = within(row('Vazio'))
    const toggle = vazio.getByRole('switch', { name: 'Ativar ou desativar Vazio' })
    expect(vazio.getByText('Inativo')).toBeInTheDocument()
    expect(toggle).toBeDisabled()
    expect(vazio.getByText('Vincule um conector')).toBeInTheDocument()
    fireEvent.click(toggle)
    expect(handlers.onSetAllConnectorsActive).not.toHaveBeenCalled()
  })

  it('links the title to the detail page', () => {
    renderTable([manga(1, 'Naruto', [connector('tcb', true)])])

    fireEvent.click(screen.getByRole('link', { name: 'Naruto' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/mangas/1')
  })
})
