import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LinkConnectorWizard } from './LinkConnectorWizard'
import * as api from '../services/api'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../services/api')

function renderWizard(onLink = vi.fn()) {
  renderWithProviders(
    <LinkConnectorWizard
      mangaTitle='Agricultor da Torre'
      linkedPluginIds={['mangeek']}
      isLinking={false}
      onLink={onLink}
      onCancel={vi.fn()}
    />,
  )
  return onLink
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.fetchPlugins).mockResolvedValue([
    { id: 'mangeek', name: 'Mangeek' },
    { id: 'nexustoons', name: 'Nexus Toons' },
  ])
})

describe('LinkConnectorWizard', () => {
  it('hides plugins already linked to the manga', async () => {
    renderWizard()

    expect(await screen.findByRole('option', { name: 'Nexus Toons' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Mangeek' })).not.toBeInTheDocument()
  })

  it('links the chosen catalog entry to the existing manga without asking for a local title', async () => {
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([{ id: 'o-ultimo-agricultor', title: 'O Último Agricultor' }])
    const onLink = renderWizard()

    await screen.findByRole('option', { name: 'Nexus Toons' })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'nexustoons' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'O Último Agricultor' }))

    expect(screen.queryByLabelText(/título \(pasta local\)/i)).not.toBeInTheDocument()
    expect(screen.getByText('Agricultor da Torre')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^vincular$/i }))
    expect(onLink).toHaveBeenCalledWith({
      idPlugin: 'nexustoons',
      idMangaPlugin: 'o-ultimo-agricultor',
      titlePlugin: 'O Último Agricultor',
    })
  })
})

describe('LinkConnectorWizard with "Todos os plugins"', () => {
  it('searches only the plugins not linked yet', async () => {
    vi.mocked(api.fetchMangasByPlugin).mockResolvedValue([{ id: 'o-ultimo-agricultor', title: 'O Último Agricultor' }])
    const onLink = renderWizard()

    await screen.findByRole('option', { name: 'Nexus Toons' })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'O Último Agricultor (Nexus Toons)' }))

    expect(api.fetchMangasByPlugin).toHaveBeenCalledTimes(1)
    expect(api.fetchMangasByPlugin).toHaveBeenCalledWith('nexustoons')
    fireEvent.click(screen.getByRole('button', { name: /^vincular$/i }))
    expect(onLink).toHaveBeenCalledWith({
      idPlugin: 'nexustoons',
      idMangaPlugin: 'o-ultimo-agricultor',
      titlePlugin: 'O Último Agricultor',
    })
  })
})
